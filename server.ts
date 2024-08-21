import { getModels } from "./dal";

async function main() {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    process.exit(1);
  }

  const { Link } = await getModels();

  console.log("==== STARTED TESTING THE DATABASE ====");

  const key = "example";
  const value = "https://example.com";

  Link.set(key, value);

  const link = Link.get(key);

  console.log({ link });

  console.log("==== FINISHED TESTING THE DATABASE ====");

  const port = process.env.PORT || 3000;

  console.log(`\n> Server listening on port ${port}`);

  Bun.serve({
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);

      switch (url.pathname) {
        case "/": {
          switch (req.method) {
            case "GET":
              const text = `To create a new short URL, send a POST request to this URL with the following body: API key, Short URL and Original URL separated by new lines.\n`;

              return new Response(text, { status: 200 });

            case "POST": {
              const body = await req.text();

              if (!body || body.length > 5 * 1024) {
                return new Response("Bad request", { status: 400 });
              }

              const [apiKey, shortUrl, originalUrl] = body.split("\n");

              if (apiKey !== process.env.API_KEY) {
                return new Response("Unauthorized", { status: 401 });
              }

              if (
                !shortUrl ||
                !originalUrl ||
                shortUrl.length > 100 ||
                originalUrl.length > 10_000
              ) {
                return new Response("Bad request", { status: 400 });
              }

              Link.set(shortUrl, originalUrl);

              return new Response(`Created: ${shortUrl}`, { status: 201 });
            }

            default:
              return new Response("Method not allowed", { status: 405 });
          }
        }

        default: {
          const link = Link.get(url.pathname.slice(1));

          if (link) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: link.original_url,
              },
            });
          }

          return new Response("Not found", { status: 404 });
        }
      }
    },

    port: process.env.PORT || 3000,
  });
}

main();
