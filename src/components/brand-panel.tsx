"use client";

import { Field, Section } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Brand } from "@/lib/schema";

export function BrandPanel({
  brand,
  update,
}: {
  brand: Brand;
  update: (patch: Partial<Brand>) => void;
}) {
  return (
    <Section
      title="Profil de marque"
      description="Renseigné une seule fois, réutilisé à chaque génération. Enregistré dans ce navigateur."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Entreprise" htmlFor="brand-name">
          <Input
            id="brand-name"
            value={brand.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Maison Kola"
          />
        </Field>

        <Field label="Secteur / activité" htmlFor="brand-sector">
          <Input
            id="brand-sector"
            value={brand.sector}
            onChange={(e) => update({ sector: e.target.value })}
            placeholder="Torréfaction artisanale, vente en ligne"
          />
        </Field>

        <Field label="Audience cible" htmlFor="brand-audience">
          <Input
            id="brand-audience"
            value={brand.audience}
            onChange={(e) => update({ audience: e.target.value })}
            placeholder="25-40 ans, urbains, sensibles au made in local"
          />
        </Field>

        <Field label="Ton de marque" htmlFor="brand-tone">
          <Input
            id="brand-tone"
            value={brand.tone}
            onChange={(e) => update({ tone: e.target.value })}
            placeholder="Direct, chaleureux, un peu d'humour"
          />
        </Field>
      </div>

      <Field
        label="Interdits"
        htmlFor="brand-avoid"
        hint="Mots bannis, promesses à ne jamais faire, sujets sensibles."
      >
        <Textarea
          id="brand-avoid"
          rows={2}
          value={brand.avoid}
          onChange={(e) => update({ avoid: e.target.value })}
          placeholder="Ne jamais citer un concurrent, pas de promesse de livraison en 24h"
        />
      </Field>

      <Field
        label="Vos publications existantes"
        htmlFor="brand-examples"
        hint="C'est le champ qui améliore le plus le résultat : l'agent imite une voix réelle au lieu de la deviner à partir d'adjectifs."
      >
        <Textarea
          id="brand-examples"
          rows={4}
          value={brand.examples}
          onChange={(e) => update({ examples: e.target.value })}
          placeholder={
            "On a torréfié 40 kg ce matin. L'atelier sent le caramel et personne ne s'en plaint.\n---\nRappel : la boutique ferme à 18h vendredi."
          }
        />
      </Field>
    </Section>
  );
}
