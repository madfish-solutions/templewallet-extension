module.exports = {
  "extends": [
    "react-app",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  "plugins": ["import", "prettier"],
  "parser": "@typescript-eslint/parser",
  "overrides": [{
    "files": ["*.ts", "*.tsx"],
    "parserOptions": {
      "project": ["./tsconfig.json", "./e2e/tsconfig.json", "./webpack/tsconfig.json"]
    }
  }],
  "settings": {
    "import/resolver": {
      "typescript": {
        "project": ["tsconfig.json", "e2e/tsconfig.json"]
      },
      "node": {
        "extensions": [".d.ts"]
      }
    }
  },
  "ignorePatterns": "src/**/*.embed.js",
  "rules": {
    "prettier/prettier": "error",
    "prefer-const": "error",
    "import/no-duplicates": "error",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-self-import": "error",
    "import/no-cycle": "error",
    "import/order": [
      "error",
      {
        "pathGroups": [
          {
            "pattern": "react",
            "group": "external",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["react"],
        "groups": [["external", "builtin"], "internal", "parent", "sibling", "index"],
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always"
      }
    ],
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
