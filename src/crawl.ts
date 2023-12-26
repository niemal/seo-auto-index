import db from "./db/db";
import { pages } from "./db/schema";
import { eq } from "drizzle-orm";
import pushToBing from "./bing";
import pushToGoogle from "./google";

export default async function core() {
  const urls = await crawlSitemaps();

  const urlsToPush: Array<string> = [];
  for (const url of urls) {
    const resp = await fetch(url);
    const body = await resp.text();

    if (resp.status !== 200) {
      console.log(
        `[${new Date().toISOString()}][${url}] Failed to fetch: ${resp.status}`
      );
      continue;
    }

    const hasher = new Bun.CryptoHasher("md5");
    hasher.update(body);
    const hash = hasher.digest("hex");

    const exists = await db.select().from(pages).where(eq(pages.url, url));
    if (exists.length === 0) {
      db.insert(pages).values({ url, content: hash });
      urlsToPush.push(url);
    } else if (exists[0].content !== hash) {
      // New hash found, updating with it.
      db.update(pages).set({ content: hash }).where(eq(pages.url, url));
      urlsToPush.push(url);
    }
  }

  if (urlsToPush.length > 0) {
    await pushToGoogle(urlsToPush);
    await pushToBing(urlsToPush);
  }
}

async function crawlSitemaps() {
  const target = process.env.TARGET;

  if (!target) {
    throw new Error("Missing TARGET from .env file.");
  }

  // Get robots.txt
  const resp = await fetch(`${target}/robots.txt`);
  const body = await resp.text();

  // Parse for sitemaps.
  const sitemaps = body
    .split("\n")
    .filter((line) => line.toLowerCase().startsWith("sitemap:"))
    .map((line) => line.toLowerCase().replace("sitemap:", "").trim());

  console.log({ sitemaps });
  let allUrls: Array<string> = [];
  // Crawl each sitemap.
  for (let i = 0; i < sitemaps.length; i++) {
    const resp = await fetch(sitemaps[i]);
    const body = await resp.text();

    // Parse for urls.
    const urls = body
      .split("\n")
      .map((line) => {
        const sitemapMatches = line.match(
          /<sitemap><loc>(https?:\/\/[^\s]+)<\/loc><\/sitemap>/
        );

        if (sitemapMatches && !sitemaps.includes(sitemapMatches[1])) {
          sitemaps.push(sitemapMatches[1]);
        }

        const matches = line.match(/<loc>(https?:\/\/[^\s]+)<\/loc>/);
        return matches ? matches[1] : null;
      })
      .filter(
        (url) => url !== null && !sitemaps.includes(url)
      ) as Array<string>;

    allUrls = [...new Set([...allUrls, ...urls])];
  }

  return allUrls;
}
