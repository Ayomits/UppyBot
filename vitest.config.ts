import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules", "**/dist", ".idea", ".git", ".cache"],
    passWithNoTests: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.test.json",
    },
    alias: [
      {
        find: "#/",
        replacement: path.resolve(__dirname, "./dist"),
      },
    ],
    coverage: {
      enabled: true,
      all: true,
      reporter: ["text", "lcov", "cobertura"],
      provider: "v8",
      include: ["src"],
      exclude: [
        "**/*.{interface,type,d}.ts",
        "**/{interfaces,types}/*.ts",
        "**/index.{js,ts}",
        "**/exports/*.{js,ts}",
      ],
    },
  },
});
