import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

export default {
  targets: [
    {
      name: "chromium",
      engine: web(),
      app: {
        url: "http://127.0.0.1:3000",
        command: {
          executable: "pnpm",
          args: ["start", "--hostname", "127.0.0.1"],
          log: ".e2e/logs/app.log",
        },
      },
    },
  ],
  tests: "tests/**/*.e2e.ts",
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporters: ["list", "junit"],
  video: "retain-on-failure",
} satisfies E2EConfig;
