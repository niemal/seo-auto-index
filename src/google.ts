import google from "googleapis";

export default async function publishUpdatedToGoogle(urls: Array<string>) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials from .env file.");
  }

  const jwtClient = new google.Auth.JWT(
    clientEmail,
    undefined,
    privateKey.replace(/(\\|\\\\)n/g, "\n"),
    ["https://www.googleapis.com/auth/indexing"],
    undefined
  );

  const tokens = await jwtClient.authorize();
  const options = {
    url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    auth: { bearer: tokens.access_token ?? "" },
    json: {
      url: urls[0],
      type: "URL_UPDATED",
    },
  };

  const pushedUrls: Array<string> = [];
  for (let i = 1; i < urls.length; i++) {
    const urlOptions = {
      ...options,
      json: { url: urls[i], type: "URL_UPDATED" },
    };

    const resp = await fetch(options.url, {
      method: urlOptions.method,
      headers: urlOptions.headers,
      body: JSON.stringify(urlOptions.json),
    });

    const body = await resp.json();
    console.log(
      `[${new Date().toISOString()}][${urls[i]}] Pushed to google successfully.`
    );

    if (resp.status === 200) {
      pushedUrls.push(urls[i]);
    }
  }

  return pushedUrls;
}
