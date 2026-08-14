import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit embarque dotenv mais ne lit que `.env`. Or Next.js met les
// secrets dans `.env.local`. Sans cette ligne, DATABASE_URL est introuvable et
// la commande échoue sans dire pourquoi.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
