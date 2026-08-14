import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { QuotaState } from "./quota-shared";

export type { QuotaState } from "./quota-shared";
export { estimateCampaignCost } from "./quota-shared";

/**
 * Crédits offerts chaque mois sur l'offre gratuite.
 *
 * Un crédit = un appel modèle facturé. Une campagne coûte 1 crédit de brief
 * plus 1 par réseau, plus 1 par réparation déclenchée. Compter les campagnes
 * mentirait sur la dépense : une campagne à six réseaux coûte trois fois plus
 * qu'une campagne à deux.
 */
export const FREE_MONTHLY_CREDITS = Number(process.env.CM_FREE_CREDITS ?? 60);

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getQuota(organizationId: string): Promise<QuotaState> {
  const [row] = await db
    .select({ used: sql<number>`coalesce(sum(${schema.usage.credits}), 0)` })
    .from(schema.usage)
    .where(
      and(
        eq(schema.usage.organizationId, organizationId),
        gte(schema.usage.createdAt, startOfMonth()),
      ),
    );

  const used = Number(row?.used ?? 0);
  const limit = FREE_MONTHLY_CREDITS;

  const reset = startOfMonth();
  reset.setUTCMonth(reset.getUTCMonth() + 1);

  return { used, limit, remaining: Math.max(0, limit - used), resetsOn: reset };
}

/**
 * Enregistre un appel modèle consommé.
 *
 * Appelé APRÈS l'appel, pas avant : on ne facture que ce qui a réellement
 * abouti. Un réseau qui échoue en 429 ne doit pas être décompté.
 */
export async function recordUsage(params: {
  organizationId: string;
  userId: string | null;
  kind: "brief" | "post" | "repair" | "reply";
  network?: string | null;
  model: string;
  credits?: number;
}): Promise<void> {
  await db.insert(schema.usage).values({
    organizationId: params.organizationId,
    userId: params.userId,
    kind: params.kind,
    network: params.network ?? null,
    model: params.model,
    credits: params.credits ?? 1,
  });
}
