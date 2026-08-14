"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getQuota } from "./quota";
import { requireViewer } from "./session";

/**
 * Export complet des données avant suppression.
 *
 * Proposé systématiquement : partir d'un service en y laissant six mois de
 * travail n'est pas acceptable, et c'est ce qui fait la différence entre une
 * suppression correcte et un bouton qui efface tout sans prévenir.
 */
export async function exportAccount() {
  const viewer = await requireViewer();

  const brands = await db
    .select()
    .from(schema.brand)
    .where(eq(schema.brand.organizationId, viewer.organizationId));

  const campaigns = await db
    .select()
    .from(schema.campaign)
    .where(eq(schema.campaign.organizationId, viewer.organizationId));

  const posts = campaigns.length
    ? await db.select().from(schema.post)
    : [];

  const quota = await getQuota(viewer.organizationId);

  return {
    exporteLe: new Date().toISOString(),
    compte: { nom: viewer.name, email: viewer.email },
    organisation: viewer.organizationName,
    consommation: { utilise: quota.used, limite: quota.limit },
    marques: brands,
    campagnes: campaigns.map((c) => ({
      ...c,
      posts: posts.filter((p) => p.campaignId === c.id),
    })),
  };
}

/**
 * Suppression du compte.
 *
 * Suppression réelle et immédiate des données métier : les cascades du schéma
 * emportent marques, campagnes, posts et consommation. L'utilisateur est
 * prévenu qu'il doit exporter avant.
 *
 * Note pour plus tard : quand la facturation existera, il faudra conserver les
 * factures — obligation légale — donc dissocier la purge des données de la
 * suppression du compte lui-même.
 */
export async function deleteAccount(confirmation: string) {
  const viewer = await requireViewer();

  if (confirmation !== viewer.email) {
    return {
      ok: false as const,
      error: "Saisissez votre adresse e-mail exacte pour confirmer.",
    };
  }

  // Supprimer l'utilisateur suffit : `member` cascade, et l'organisation part
  // avec la marque via les clés étrangères. On supprime l'organisation
  // explicitement pour ne pas laisser d'orpheline.
  await db
    .delete(schema.organization)
    .where(eq(schema.organization.id, viewer.organizationId));

  await db.delete(schema.user).where(eq(schema.user.id, viewer.userId));

  return { ok: true as const };
}
