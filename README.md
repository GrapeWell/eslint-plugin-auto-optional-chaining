# eslint-plugin-auto-optional-chaining

ESLint plugin that automatically converts regular property access (`.`) to optional chaining (`?.`) to prevent null/undefined errors.

## Why Use This Plugin?

When working with data from backend APIs, you often encounter cases where properties might be `null` or `undefined`. 
Using regular property access like `data.results.items` can result in runtime errors if any part of the chain is nullish.

This plugin automatically fixes this common issue by converting regular property access to optional chaining,
helping you avoid the dreaded:

```javascript
TypeError: Cannot read property 'x' of null TypeError: Cannot read properties of undefined (reading 'y')
```


## Installation

```sh
npm i eslint --save-dev
npm i eslint-plugin-auto-optional-chaining --save-dev
```

## Usage
Add to your ESLint config:
```javascript
module.exports = {
  plugins: ["auto-optional-chaining"],
  rules: {
    "auto-optional-chaining/auto-optional-chaining": ["error", {
      excludeIdentifiers: ['myParams'] // optional
    }]
  }
}
```

## Examples

What it fixes:
```javascript
// ❌ Risky code that might crash
const username = response.data.user.name;
const firstItem = items[0].title;

// ✅ Automatically converted to:
const username = response?.data?.user?.name;
const firstItem = items?.[0]?.title;
```
It also handles logical expressions:
```javascript
// ❌ Before:
const isAdmin = user && user.role && user.role.permissions;

// ✅ After:
const isAdmin = user?.role?.permissions;
```

## TypeScript Support
This plugin can be used in TypeScript projects with @typescript-eslint/parser, but users need to configure it themselves


```javascript
import autoOptionalChaining from 'eslint-plugin-auto-optional-chaining';
import tsParser from '@typescript-eslint/parser';
{
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'auto-optional-chaining': autoOptionalChaining,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'auto-optional-chaining/auto-optional-chaining': [
        'error',
        {
          excludeIdentifiers: ['myChart'],
        },
      ],
    },
  },
```
