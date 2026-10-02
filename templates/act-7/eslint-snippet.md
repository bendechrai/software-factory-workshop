# ESLint: give bin/evidence.mjs the Node globals

`bin/evidence.mjs` uses `process`, `fetch`, `setTimeout` and `console`. Without the Node globals,
ESLint reports 11 `no-undef` errors and the pre-commit hook fails the commit.

In `eslint.config.js`, find the block that sets `globals.node` and add `"bin/**/*.mjs"` to its
`files` list. In the demo it looks like this (the added entry is `"bin/**/*.mjs"`):

```js
{
  files: ["src/**/*.ts", "e2e/**/*.ts", "bin/**/*.mjs", "playwright.config.ts", "eslint.config.js"],
  languageOptions: { globals: globals.node },
  rules: { "@typescript-eslint/no-explicit-any": "error" },
},
```

Your `files` list may differ from the demo's. Keep your own entries and add the one new glob.
If your config has no block that uses `globals.node`, add the whole block above, and make sure
`import globals from "globals";` is at the top of the file.

Check it with `npx eslint bin/evidence.mjs`, which must exit 0.
