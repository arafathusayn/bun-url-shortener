import { Database } from "bun:sqlite";

export default async function setup() {
  const DATABASE_PATH = process.env.DATABASE_PATH || "db.sqlite";

  const db = new Database(DATABASE_PATH, { strict: true, create: true });

  db.exec("PRAGMA journal_mode = WAL;");

  db.exec(await Bun.file("links_schema.sql").text());

  const result = db.prepare("select count(*) FROM links;").get() as Record<
    string,
    unknown
  >;

  const count =
    "count(*)" in result ? result["count(*)"] : panic("No count(*) in result");

  if (typeof count !== "number") {
    panic("Invalid count(*) in result");
  }

  console.log(`Found ${count} links in the database.`);

  return {
    db,
  };
}

export function panic(message: string): never {
  throw new Error(message);
}
