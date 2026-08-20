import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript rules
      // no-explicit-any: OFF — required for Prisma build worker compatibility
      // (Prisma types are lost in Next.js build workers, so `as any[]` casts are mandatory)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      
      // React rules
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      
      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // JS quality rules
      "prefer-const": "warn",
      "no-unused-vars": "off",
      // no-console: OFF — server-side code legitimately uses console.log for debugging
      "no-console": "off",
      "no-debugger": "error",
      "no-empty": "warn",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-fallthrough": ["warn", { commentPattern: "fallthrough|passes?through" }],
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "warn",
      "no-useless-escape": "off",
    },
  },
];

export default eslintConfig;
