import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This SPA loads data on mount and hydrates persisted UI prefs from
      // localStorage inside effects — both intentional and safe here.
      "react-hooks/set-state-in-effect": "off",
      // The compiled ArchitectUI theme is served from /public and linked in
      // <head>; it cannot be `import`ed because its font URLs are relative.
      "@next/next/no-css-tags": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
