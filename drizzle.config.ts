import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATA_DIR
      ? `${process.env.DATA_DIR.replace(/\/$/, "")}/dashboard.sqlite`
      : "./data/dashboard.sqlite",
  },
});
