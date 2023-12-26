export default async function pushToBing(urls: Array<string>) {
  const apiKey = process.env.BING_API_KEY;
  const target = process.env.TARGET;

  if (!apiKey || !target) {
    throw new Error("Missing BING_API_KEY or TARGET from .env file.");
  }

  const origin = urls.length;
  urls = urls.slice(0, 10000);

  const options = {
    url: `https://bing.com/webmaster/api.svc/json/SubmitUrlbatch?​apikey=${apiKey}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    json: {
      siteUrl: target,
      urlList: urls,
    },
  };

  const resp = await fetch(options.url, {
    method: options.method,
    headers: options.headers,
    body: JSON.stringify(options.json),
  });

  const body = await resp.json();

  if (resp.status !== 200) {
    console.log(
      `[${new Date().toISOString()}][all minus ${
        origin - urls.length
      }] Failed to push to bing.`
    );
    console.log({ body });
    return [];
  }

  console.log(
    `[${new Date().toISOString()}][all minus ${
      origin - urls.length
    }] Pushed to bing successfully.`
  );

  return urls;
}
