import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { auth } from "./auth";

export type Viewer = {
  userId: string;
  email: string;
  name: string;
  role: string | null;
  organizationId: string;
  organizationName: string;
};

/**
 * Identité de l'appelant, ou `null`.
 *
 * Renvoie toujours l'organisation avec l'utilisateur : dans cette application
 * rien n'appartient à une personne, tout appartient à une organisation. Séparer
 * les deux inviterait à écrire des requêtes non filtrées.
 */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const rows = await db
    .select({
      organizationId: schema.organization.id,
      organizationName: schema.organization.name,
    })
    .from(schema.member)
    .innerJoin(
      schema.organization,
      eq(schema.member.organizationId, schema.organization.id),
    )
    .where(eq(schema.member.userId, session.user.id))
    .limit(1);

  const org = rows[0];
  if (!org) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role ?? null,
    organizationId: org.organizationId,
    organizationName: org.organizationName,
  };
}

/** Variante qui redirige vers la connexion au lieu de renvoyer `null`. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/connexion");
  return viewer;
}

/**
 * Vérifie qu'une marque appartient bien à l'organisation de l'appelant.
 *
 * À utiliser sur toute route qui reçoit un identifiant de marque venant du
 * client. Sans ce contrôle, il suffirait de deviner un identifiant pour lire
 * les campagnes d'un concurrent — le bug classique du SaaS multi-client.
 */
export async function assertBrandBelongsTo(
  brandId: string,
  organizationId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: schema.brand.id })
    .from(schema.brand)
    .where(
      and(
        eq(schema.brand.id, brandId),
        eq(schema.brand.organizationId, organizationId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}
