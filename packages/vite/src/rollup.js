// @ts-check
import { getRollupOptions } from "@serwist/constants/rollup";

import packageJson from "../package.json" assert { type: "json" };

export default getRollupOptions({
  packageJson,
  jsFiles: [
    {
      input: {
        index: "src/index.ts",
        "index.browser": "src/index.browser.ts",
        "index.worker": "src/index.worker.ts",
      },
      output: {
        dir: "dist",
        format: "esm",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
      external: ["virtual:internal-serwist"],
    },
  ],
});
