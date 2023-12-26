import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  content: text("content").notNull(),
});
