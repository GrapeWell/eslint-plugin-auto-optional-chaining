/**
 * @fileoverview Fix most possible code errors through optional chaining
 * @author sickhack
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Fix most possible code errors through optional chaining",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          excludeIdentifiers: {
            type: "array",
            items: { type: "string" },
          },
          excludeChainMethods: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      usePreferChaining: "Prefer optional chaining.",
      usePropertyChaining:
        "Use optional chaining instead of regular property access.",
      useOptionalComputed:
        "Use optional chaining (?.[]) for computed property access",
    },
  },

  create: function (context) {
    const sourceCode = context.getSourceCode();

    const processedNodes = new Set();
    const cssModuleIdentifiers = new Set();
    // 获取用户配置
    const options = context.options[0] || {};
    const userExcludeList = options.excludeIdentifiers || [];

    // 默认排除列表
    const defaultExcludeList = [
      "axios",
      "lodash",
      "moment",
      "dayjs",
      "process",
      "jquery",
      "Object",
      "Array",
      "Number",
      "String",
      "JSON",
      "Math",
      "Reflect",
      "Symbol",
      "document",
      "console",
      "React",
      "localStorage",
      "sessionStorage",
      "module",
      "import",
    ];

    const excludeList = [...defaultExcludeList, ...userExcludeList];

    function processChain(node, context) {
      if (node.type !== "MemberExpression" || node.optional) {
        return;
      }

      // 处理嵌套的成员访问
      if (node.object.type === "MemberExpression" && !node.object.optional) {
        processChain(node.object, context);
      }

      // 检查是否是方法调用
      const isMethodCall =
        node.parent &&
        node.parent.type === "CallExpression" &&
        node.parent.callee === node;

      // 报告问题并提供修复
      context.report({
        node,
        messageId: "usePropertyChaining",
        fix(fixer) {
          // 获取源代码
          const sourceCode = context.getSourceCode();
          // 获取点操作符的位置
          const dotToken = sourceCode.getTokenAfter(
            node.object,
            (token) => token.value === "."
          );

          if (isMethodCall) {
            // 为方法调用添加可选链
            const fixes = [fixer.insertTextBefore(dotToken, "?")];

            return fixes;
          } else {
            // 在点操作符前插入问号
            return fixer.insertTextBefore(dotToken, "?");
          }
        },
      });
    }

    function processComputedProperty(node, context) {
      // 递归处理对象部分保持不变
      if (node.object.type === "MemberExpression" && !node.object.optional) {
        if (node.object.computed) {
          processComputedProperty(node.object, context);
        } else {
          processChain(node.object, context);
        }
      }

      context.report({
        node,
        messageId: "useOptionalComputed",
        fix(fixer) {
          const sourceCode = context.getSourceCode();
          const bracketToken = sourceCode.getTokenAfter(
            node.object,
            (token) => token.value === "["
          );

          // 检查对象与方括号之间是否有点操作符
          const tokensBetween = sourceCode.getTokensBetween(
            node.object,
            bracketToken
          );
          const dotToken = tokensBetween.find((token) => token.value === ".");

          if (dotToken) {
            // 替换点为可选链
            return fixer.replaceText(dotToken, "?.");
          } else {
            // 在方括号前插入可选链
            return fixer.insertTextBefore(bracketToken, "?.");
          }
        },
      });
    }

    // 添加缓存，避免重复计算相同节点
    const globalMethodCallCache = new WeakMap();

    function isGlobalObjectMethodCall(node) {
      // 检查缓存中是否已有结果
      if (globalMethodCallCache.has(node)) {
        return globalMethodCallCache.get(node);
      }

      // 如果没有对象属性，则不是成员表达式
      if (!node.object) {
        globalMethodCallCache.set(node, false);
        return false;
      }

      // 检查根对象是否在排除列表中
      if (
        node.object.type === "Identifier" &&
        excludeList.includes(node.object.name)
      ) {
        globalMethodCallCache.set(node, true);
        return true;
      }

      // 预先定义结果变量，避免多次递归调用
      let result = false;

      // 检查是否是异步方法调用的结果
      if (
        node.object.type === "CallExpression" &&
        node.object.callee &&
        node.object.callee.type === "MemberExpression"
      ) {
        const callee = node.object.callee;
        if (callee.property && callee.property.type === "Identifier") {
          // 检查方法名是否为异步方法 - 使用 Set 优化查找性能
          const asyncMethods = new Set([
            "then",
            "catch",
            "finally", // Promise
            "get",
            "post",
            "put",
            "delete", // HTTP
            "subscribe", // RxJS
          ]);

          if (asyncMethods.has(callee.property.name)) {
            globalMethodCallCache.set(node, true);
            return true;
          }
        }

        // 递归检查异步方法链
        result = isGlobalObjectMethodCall(callee);
        if (result) {
          globalMethodCallCache.set(node, true);
          return true;
        }
      }

      // 递归检查对象链
      if (node.object.type === "MemberExpression") {
        result = isGlobalObjectMethodCall(node.object);
        globalMethodCallCache.set(node, result);
        return result;
      }

      globalMethodCallCache.set(node, false);
      return false;
    }

    function isCssModulesAccess(node) {
      return (
        node.object.type === "Identifier" &&
        // 1. 检查是否匹配已知的 CSS 模块导入
        (cssModuleIdentifiers.has(node.object.name) ||
          // 2. 保留常见命名约定作为后备
          ["styles", "css", "classes", "cx", "classNames"].includes(
            node.object.name
          ))
      );
    }

    return {
      "LogicalExpression[operator=&&]:exit": function (node) {
        if (
          node.parent.type == "LogicalExpression" &&
          node.parent.operator == "&&"
        ) {
          return;
        }
        let ops = [node.right];

        let left = node.left;
        while (left.type == "LogicalExpression" && left.operator == "&&") {
          ops.push(left.right);
          left = left.left;
        }

        ops.push(left);
        ops = ops.reverse();

        let first, last;
        for (first = 0; first < ops.length - 1; first++) {
          if (
            ops[first + 1].type == "MemberExpression" &&
            equalTokens(ops[first], ops[first + 1].object, sourceCode)
          )
            break;
        }
        if (first == ops.length - 1) return;

        for (
          last = first + 1;
          last < ops.length - 1 &&
          ops[last + 1].type == "MemberExpression" &&
          equalTokens(ops[last], ops[last + 1].object, sourceCode);
          last++
        );

        let r = sourceCode.getText(ops[first]);
        for (let i = first + 1; i <= last; i++) {
          r +=
            "?." +
            (ops[i].computed ? "[" : "") +
            sourceCode.getText(ops[i].property) +
            (ops[i].computed ? "]" : "");
        }

        for (let i = first + 1; i <= last; i++) {
          if (ops[i].type === "MemberExpression") {
            processedNodes.add(ops[i]);
          }
        }

        context.report({
          node,
          messageId: "usePreferChaining",
          fix: function (fixer) {
            return fixer.replaceTextRange(
              [ops[first].range[0], ops[last].range[1]],
              r
            );
          },
        });
      },

      // 处理 CSS 文件导入
      ImportDeclaration(node) {
        const source = node.source.value;

        // 检查是否导入 CSS 文件
        if (/\.(css|scss|less|styl|sass|module\.css)$/i.test(source)) {
          // 记录默认导入名称
          node.specifiers.forEach((specifier) => {
            if (
              specifier.type === "ImportDefaultSpecifier" ||
              specifier.type === "ImportNamespaceSpecifier"
            ) {
              cssModuleIdentifiers.add(specifier.local.name);
            }
          });
        }
      },
      "MemberExpression:exit": function (node) {
        if (processedNodes.has(node)) {
          return;
        }

        if (node.optional) {
          return;
        }

        if (isCssModulesAccess(node)) {
          return;
        }

        if (isGlobalObjectMethodCall(node)) {
          return;
        }

        if (shouldSkipOptionalChaining(node, context)) {
          return;
        }

        if (node.computed) {
          processComputedProperty(node, context);
          return;
        }

        let parent = node.parent;
        while (parent) {
          if (
            parent.type === "MemberExpression" &&
            parent.object === node &&
            !parent.optional
          ) {
            return;
          }
          parent = parent.parent;
        }

        if (isPartOfLogicalChain(node)) {
          return;
        }

        processChain(node, context);
      },
    };
  },
};

// from https://autodocs.io/view/eslint/eslint/lib_rules_no-useless-call.js.html
function equalTokens(left, right, sourceCode) {
  const tokensL = sourceCode.getTokens(left);
  const tokensR = sourceCode.getTokens(right);
  if (tokensL.length !== tokensR.length) {
    return false;
  }
  for (let i = 0; i < tokensL.length; ++i) {
    if (
      tokensL[i].type !== tokensR[i].type ||
      tokensL[i].value !== tokensR[i].value
    ) {
      return false;
    }
  }
  return true;
}

function isPartOfLogicalChain(node) {
  let parent = node.parent;

  // Check if this member expression is on the right side of a logical operator (&& or ||)
  if (
    parent &&
    parent.type === "LogicalExpression" &&
    (parent.operator === "&&" || parent.operator === "||") &&
    parent.right === node
  ) {
    return true;
  }

  // Check if this is on the left side and object of another member expression that's part of a chain
  if (
    parent &&
    parent.type === "MemberExpression" &&
    parent.object === node &&
    isPartOfLogicalChain(parent)
  ) {
    return true;
  }

  return false;
}

function isInsideAsyncCallback(node) {
  let current = node;
  let foundAsyncCallback = false;
  let immediateCallback = false;

  while (current.parent) {
    // 找到函数表达式
    if (
      current.parent.type === "ArrowFunctionExpression" ||
      current.parent.type === "FunctionExpression"
    ) {
      // 检查函数是否作为回调传给了异步方法
      let functionNode = current.parent;
      if (
        functionNode.parent &&
        functionNode.parent.type === "CallExpression" &&
        functionNode.parent.callee &&
        functionNode.parent.callee.type === "MemberExpression"
      ) {
        const callee = functionNode.parent.callee;
        if (callee.property && callee.property.type === "Identifier") {
          // 检查方法名是否为异步方法
          const asyncMethods = [
            "then",
            "catch",
            "finally", // Promise 相关方法
          ];

          if (asyncMethods.includes(callee.property.name)) {
            foundAsyncCallback = true;

            // 检查当前节点是否是回调的参数，如 res => res.data 中的 res.data
            // 这种情况不应该添加可选链
            const params = current.parent.params || [];
            for (const param of params) {
              if (
                param.type === "Identifier" &&
                node.object &&
                node.object.type === "Identifier" &&
                node.object.name === param.name
              ) {
                immediateCallback = true;
                break;
              }
            }
          }
        }
      }
    }
    current = current.parent;
  }

  // 只有当是回调参数的直接使用时才排除
  return foundAsyncCallback && immediateCallback;
}

function shouldSkipOptionalChaining(node, context) {
  const options = context.options[0] || {};
  const userExcludeChainMethods = options.excludeChainMethods || [];

  const asyncChainMethods = [
    "then",
    "catch",
    "finally", // Promise 方法
    "subscribe", // RxJS 方法
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "use",
    "all", // HTTP/Express 方法
  ];

  const asyncMethodsToExclude = [
    ...asyncChainMethods,
    ...userExcludeChainMethods,
  ];

  // 检查是否是要排除的异步链式方法
  if (
    node.property &&
    node.property.type === "Identifier" &&
    asyncMethodsToExclude.includes(node.property.name)
  ) {
    return true;
  }

  // 检查是否在异步回调函数中的直接参数使用
  // 只有这种情况才跳过添加可选链
  if (isInsideAsyncCallback(node)) {
    return true;
  }

  // 检查是否在任何赋值表达式的左侧
  // 不仅检查直接父级，还检查整个赋值链路
  let current = node;
  let parent = node.parent;
  while (parent) {
    // 直接赋值表达式 (a.b.c = value)
    if (parent.type === "AssignmentExpression" && parent.left === current) {
      return true;
    }

    // 复合赋值表达式 (a.b.c += value)
    if (
      parent.type === "AssignmentExpression" &&
      parent.operator !== "=" &&
      parent.left === current
    ) {
      return true;
    }

    // 解构赋值 ({a: obj.prop} = value)
    if (parent.type === "Property" && parent.value === current) {
      let grandParent = parent.parent;
      if (
        grandParent &&
        (grandParent.type === "ObjectPattern" ||
          grandParent.type === "ArrayPattern")
      ) {
        return true;
      }
    }

    // 更新表达式 (a.b.c++)
    if (parent.type === "UpdateExpression" && parent.argument === current) {
      return true;
    }

    // for...in 和 for...of 循环的左侧
    if (
      (parent.type === "ForInStatement" || parent.type === "ForOfStatement") &&
      parent.left === current
    ) {
      return true;
    }

    // React ref 检测 (访问 .current 属性)
    if (
      node.property &&
      node.property.type === "Identifier" &&
      node.property.name === "current" &&
      node.object &&
      node.object.type === "Identifier" &&
      (node.object.name.endsWith("Ref") || node.object.name.startsWith("ref"))
    ) {
      return true;
    }

    current = parent;
    parent = parent.parent;
  }

  return false;
}
