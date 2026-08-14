"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { brandSchema } from "./schema";
import { requireViewer } from "./session";

/**
 * Toutes les fonctions de ce fichier filtrent par organisation, sans exception.
 * L'`organizationId` ne vient jamais du client : il est relu depuis la session
 * à chaque appel. C'est ce qui rend impossible la lecture des données d'une
 * autre organisation, même en devinant un identifiant.
 */

export async function listBrands() {
  const viewer = await requireViewer();

  return db
    .select()
    .from(schema.brand)
    .where(eq(schema.brand.organizationId, viewer.organizationId))
    .orderBy(desc(schema.brand.updatedAt));
}

export async function getBrand(brandId: string) {
  const viewer = await requireViewer();

  const rows = await db
    .select()
    .from(schema.brand)
    .where(
      and(
        eq(schema.brand.id, brandId),
        eq(schema.brand.organizationId, viewer.organizationId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function createBrand(input: unknown) {
  const viewer = await requireViewer();
  const parsed = brandSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const [created] = await db
    .insert(schema.brand)
    .values({ ...parsed.data, organizationId: viewer.organizationId })
    .returning();

  revalidatePath("/");
  return { ok: true as const, brand: created };
}

export async function updateBrand(brandId: string, input: unknown) {
  const viewer = await requireViewer();
  const parsed = brandSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const [updated] = await db
    .update(schema.brand)
    .set(parsed.data)
    .where(
      and(
        eq(schema.brand.id, brandId),
        eq(schema.brand.organizationId, viewer.organizationId),
      ),
    )
    .returning();

  if (!updated) return { ok: false as const, error: "Marque introuvable" };

  revalidatePath("/");
  return { ok: true as const, brand: updated };
}

export async function deleteBrand(brandId: string) {
  const viewer = await requireViewer();

  const [deleted] = await db
    .delete(schema.brand)
    .where(
      and(
        eq(schema.brand.id, brandId),
        eq(schema.brand.organizationId, viewer.organizationId),
      ),
    )
    .returning();

  if (!deleted) return { ok: false as const, error: "Marque introuvable" };

  revalidatePath("/");
  return { ok: true as const };
}
