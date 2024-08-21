import setup from "./setup";

type LinkInDatabase = {
  short_url: string;
  original_url: string;
};

function createLinkClass({ db, links }: { db: any; links: LinkInDatabase[] }) {
  return class Link {
    static set(shortUrl: string, originalUrl: string) {
      const existingLink = Link.get(shortUrl)?.original_url;

      console.log({ shortUrl, existingLink });

      if (existingLink) {
        const index = links.findIndex((link) => link.short_url === shortUrl);

        links[index].original_url = originalUrl;

        links.sort((a, b) => a.short_url.localeCompare(b.short_url));

        queueMicrotask(() => {
          db.prepare(
            `UPDATE links SET original_url = ? WHERE short_url = ?;`,
          ).run(originalUrl, shortUrl);
        });

        return;
      }

      links.push({
        short_url: shortUrl,
        original_url: originalUrl,
      });

      links.sort((a, b) => a.short_url.localeCompare(b.short_url));

      queueMicrotask(() => {
        db.prepare(
          `INSERT INTO links (short_url, original_url) VALUES (?, ?);`,
        ).run(shortUrl, originalUrl);
      });
    }

    static get(shortUrl: string) {
      const result = binarySearchString(links, shortUrl, "short_url");

      if (result) {
        return result;
      }

      const dbResult = db
        .query("SELECT * FROM links WHERE short_url = ?;")
        .get(shortUrl) as LinkInDatabase | null;

      return dbResult;
    }
  };
}

export async function getModels() {
  const { db } = await setup();

  const links = db
    .query<LinkInDatabase, any>("SELECT * FROM links;")
    .all()
    .sort((a, b) => a.short_url.localeCompare(b.short_url));

  return {
    Link: createLinkClass({ db, links }),
  };
}

function binarySearchString<T>(
  array: T[],
  value: string,
  key: keyof T,
): T | undefined {
  let left = 0;
  let right = array.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleValue = array[middle][key] as string;

    if (middleValue === value) {
      return array[middle];
    }

    if (middleValue < value) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return undefined;
}
