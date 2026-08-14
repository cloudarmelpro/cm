import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL absente. En développement : `docker compose up -d` puis vérifier .env.local.",
  );
}

/**
 * Deux pilotes, un seul point d'entrée.
 *
 * En développement la base est un Postgres ordinaire dans Docker : le pilote
 * TCP `node-postgres` convient. En production sur Neon, le pilote HTTP est
 * nettement préférable — il n'ouvre pas de connexion persistante, ce qui est
 * exactement le problème des fonctions serverless.
 *
 * Le choix se fait sur l'URL : basculer de l'un à l'autre ne demande que de
 * remplacer `DATABASE_URL`.
 *
 * Limite connue du pilote HTTP Neon : pas de transaction interactive. Utiliser
 * `db.batch([...])` pour envoyer plusieurs requêtes en un aller-retour.
 */
const isNeon = url.includes("neon.tech");

export const db = isNeon
  ? drizzleNeon({ client: neon(url), schema })
  : drizzlePg({ client: new Pool({ connectionString: url }), schema });

export { schema };
