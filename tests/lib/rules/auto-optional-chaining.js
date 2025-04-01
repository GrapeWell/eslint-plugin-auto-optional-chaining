/**
 * @fileoverview Prefer optional chaining over a sequence of validations
 * @author Horacio J Peña
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/auto-optional-chaining"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});
ruleTester.run("prefer-optional-chaining", rule, {
  valid: [
    {
      code: "a || a.b",
    },
    {
      code: "a && b && c",
    },
    {
      code: "a?.b?.c",
    },
    {
      code: "a?.b()",
    },
    {
      code: "a?.b?.c()",
    },
    {
      code: "Object.keys(a)",
    },
    {
      code: "data?.results?.[0]",
    },
    {
      code: "React.memo()",
    },
    {
      code: 'document.body.appendChild("div")',
    },
    {
      code: 'console.log("Hello World")',
    },
    {
      code: "promise.then(res => res.data)",
    },
    {
      code: 'axios.get("url").then(res => res.data)',
    },
    {
      code: "array?.map(item => item?.name)?.filter(name => name?.length > 3)",
    },
    {
      code: "users?.filter(user => user?.active)?.map(user => user?.name)",
    },
    {
      code: "response.then(data => data?.items?.map(item => item?.id))",
    },
    {
      code: "elements?.forEach(el => el?.classList?.add('active'))",
    },
    {
      code: "import styles from './styles.css'; styles.container",
      filename: "Component.js",
    },
    {
      code: "response.then(data => data.length)", // 回调参数的直接属性访问
    },
    {
      code: "const obj = {}; obj.prop = 'value';",
    },
    {
      code: "a?.()",
    },
    {
      code: "a.b.c = true",
    },
  ],

  invalid: [
    {
      code: "a && a.b",
      errors: [
        {
          message: "Prefer optional chaining.",
        },
      ],
      output: "a?.b",
    },
    {
      code: "a && a.b && a.b.c",
      errors: [{ message: "Prefer optional chaining." }],
      output: "a?.b?.c",
    },
    {
      code: "a && a.b && c.d",
      errors: [
        {
          message: "Prefer optional chaining.",
        },
      ],
      output: "a?.b && c.d",
    },
    {
      code: "c.d && a && a.b",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Prefer optional chaining.",
        },
      ],
      output: "c?.d && a?.b",
    },
    {
      code: "(a.b && a.b.c) || (d.e && d.e.f)",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        { message: "Prefer optional chaining." },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        { message: "Prefer optional chaining." },
      ],
      output: "(a.b?.c) || (d.e?.f)",
    },
    {
      code: "a[0] && a[0].b",
      errors: [
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
        {
          message: "Prefer optional chaining.",
        },
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
      ],
      output: "a[0]?.b",
    },
    {
      code: "a && a[i]",
      errors: [
        {
          message: "Prefer optional chaining.",
        },
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
      ],
      output: "a?.[i]",
    },
    {
      code: "a && a.b && a.b[c]",
      errors: [
        { message: "Prefer optional chaining." },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
      ],
      output: "a?.b?.[c]",
    },
    {
      code: "a.b && a.b[c]",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Prefer optional chaining.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
      ],
      output: "a.b?.[c]",
    },
    // {
    //   code: "a.b && a.b.c && a.b.c.d && e",
    //   errors: [{ message: "Prefer optional chaining." }],
    //   output: "a.b?.c?.d && e",
    // },
    // {
    //   code: "a.b && a.b.c && a.b.c.d && a.b.c.d == e",
    //   errors: [{ message: "Prefer optional chaining." }],
    //   output: "a.b?.c?.d && a.b.c.d == e",
    // },
    // {
    //   code: "a.b && a.b.c && a.b.c[d] && a.b.c[d].e",
    //   errors: [{ message: "Prefer optional chaining." }],
    //   output: "a.b?.c?.[d]?.e",
    // },
    {
      code: "a.b",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b",
    },
    {
      code: "a.b.c",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b?.c",
    },
    {
      code: "a?.b.c",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b?.c",
    },
    {
      code: "a.b?.c",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b?.c",
    },
    {
      code: "a.b.c.d",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b?.c?.d",
    },
    {
      code: "data.results[0];",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining (?.[]) for computed property access",
        },
      ],
      output: "data?.results?.[0];",
    },
    {
      code: "response.then(data => data.items.map(item => item.id))",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "response.then(data => data?.items?.map(item => item?.id))",
    },
    {
      code: "fetchUsers().then(response => response.data.users.filter(user => user.active))",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output:
        "fetchUsers().then(response => response?.data?.users?.filter(user => user?.active))",
    },
    {
      code: "a.b()",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b()",
    },
    {
      code: "a.b.c()",
      errors: [
        {
          message: "Use optional chaining instead of regular property access.",
        },
        {
          message: "Use optional chaining instead of regular property access.",
        },
      ],
      output: "a?.b?.c()",
    },
  ],
});
