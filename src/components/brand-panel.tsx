"use client";

import { Field, Input, Textarea } from "@/components/ui";
import type { Brand } from "@/lib/schema";

export function BrandPanel({
  brand,
  update,
}: {
  brand: Brand;
  update: (patch: Partial<Brand>) => void;
}) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-100">
          Profil de marque
        </h2>
        <p className="text-xs text-neutral-500">
          Sauvegardé dans ce navigateur, réutilisé pour chaque génération.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Entreprise">
          <Input
            value={brand.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ex. Maison Kola"
          />
        </Field>

        <Field label="Secteur / activité">
          <Input
            value={brand.sector}
            onChange={(e) => update({ sector: e.target.value })}
            placeholder="Ex. torréfaction artisanale, vente en ligne"
          />
        </Field>

        <Field label="Audience cible">
          <Input
            value={brand.audience}
            onChange={(e) => update({ audience: e.target.value })}
            placeholder="Ex. 25-40 ans, urbains, sensibles au made in local"
          />
        </Field>

        <Field label="Ton de marque">
          <Input
            value={brand.tone}
            onChange={(e) => update({ tone: e.target.value })}
            placeholder="Ex. direct, chaleureux, un peu d'humour"
          />
        </Field>

        <Field
          label="Interdits"
          hint="Mots bannis, promesses à ne jamais faire, sujets sensibles."
        >
          <Textarea
            rows={2}
            value={brand.avoid}
            onChange={(e) => update({ avoid: e.target.value })}
            placeholder="Ex. ne jamais citer un concurrent, pas de promesse de livraison en 24h"
          />
        </Field>

        <Field label="Langue de rédaction">
          <Input
            value={brand.language}
            onChange={(e) => update({ language: e.target.value })}
            placeholder="français"
          />
        </Field>

        <div className="md:col-span-2">
          <Field
            label="Vos publications existantes"
            hint="Collez 2 ou 3 posts que vous avez déjà publiés. C'est ce qui améliore le plus le résultat : l'agent imite une voix réelle au lieu de deviner à partir d'adjectifs."
          >
            <Textarea
              rows={4}
              value={brand.examples}
              onChange={(e) => update({ examples: e.target.value })}
              placeholder={
                "Ex.\nOn a torréfié 40 kg ce matin. L'atelier sent le caramel...\n---\nPetit rappel : la boutique ferme à 18h ce vendredi."
              }
            />
          </Field>
        </div>
      </div>
    </section>
  );
}
