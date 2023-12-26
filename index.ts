import { sleep } from "bun";
import init from "./src/crawl";

async function main() {
  console.log(`[${new Date().toISOString()}][seo-auto-index] Initiated.`);

  while (true) {
    // Run 5 minutes, check for changes.
    await init();
    await sleep(1000 * 60 * 5);
  }
}

main();
