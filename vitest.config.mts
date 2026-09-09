import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const testDatabaseUrl = `file:${path.join(root, "prisma", "test.db").replaceAll("\\", "/")}`;
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": path.join(root, "tests/server-only.ts") },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    exclude: ["**/node_modules/**", "**/.git/**", "tests/e2e/**"],
    globalSetup: ["./tests/global-setup.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
