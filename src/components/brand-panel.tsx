"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BrandRecord } from "@/components/workspace";
import { createBrand, deleteBrand, updateBrand } from "@/lib/brands";
import { EMPTY_BRAND, readLocalBrand, clearLocalBrand } from "@/lib/local-brand";
import type { Brand } from "@/lib/schema";

export function BrandPanel({
  brand,
  brands,
}: {
  /** `null` sur un compte neuf : le panneau démarre alors en création. */
  brand: BrandRecord | null;
  brands: BrandRecord[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Brand>(
    brand ? strip(brand) : EMPTY_BRAND,
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(!brand);

  // Profil resté dans le navigateur avant l'arrivée des comptes. On propose de
  // le reprendre plutôt que de laisser l'utilisateur ressaisir ce qu'il a déjà
  // écrit — mauvaise première impression, parfaitement évitable.
  const [local] = useState(() => readLocalBrand());

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result =
        creating || !brand
          ? await createBrand(draft)
          : await updateBrand(brand.id, draft);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setCreating(false);
      setMessage("Enregistré.");
      router.refresh();
    });
  }

  function remove() {
    if (!brand) return;
    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {local && !creating ? (
        <div className="border-primary/30 bg-accent/50 flex flex-wrap items-center gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Un profil « {local.name || "sans nom"} » est resté dans ce
            navigateur. Le reprendre ?
          </p>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearLocalBrand();
                router.refresh();
              }}
            >
              Ignorer
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDraft(local);
                clearLocalBrand();
              }}
            >
              Reprendre
            </Button>
          </div>
        </div>
      ) : null}

      <Section
        title={creating ? "Nouvelle marque" : "Profil de marque"}
        description="L'agent écrit au ton de cette marque. Un profil par client."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entreprise" htmlFor="brand-name">
            <Input
              id="brand-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Maison Kola"
            />
          </Field>

          <Field label="Secteur / activité" htmlFor="brand-sector">
            <Input
              id="brand-sector"
              value={draft.sector}
              onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
              placeholder="Torréfaction artisanale, vente en ligne"
            />
          </Field>

          <Field label="Audience cible" htmlFor="brand-audience">
            <Input
              id="brand-audience"
              value={draft.audience}
              onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
              placeholder="25-40 ans, urbains, sensibles au made in local"
            />
          </Field>

          <Field label="Ton de marque" htmlFor="brand-tone">
            <Input
              id="brand-tone"
              value={draft.tone}
              onChange={(e) => setDraft({ ...draft, tone: e.target.value })}
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
            value={draft.avoid}
            onChange={(e) => setDraft({ ...draft, avoid: e.target.value })}
            placeholder="Ne jamais citer un concurrent, pas de promesse de livraison en 24h"
          />
        </Field>

        <Field
          label="Vos publications existantes"
          htmlFor="brand-examples"
          hint="Le champ qui améliore le plus le résultat : l'agent imite une voix réelle au lieu de la deviner à partir d'adjectifs."
        >
          <Textarea
            id="brand-examples"
            rows={4}
            value={draft.examples}
            onChange={(e) => setDraft({ ...draft, examples: e.target.value })}
            placeholder={
              "On a torréfié 40 kg ce matin. L'atelier sent le caramel et personne ne s'en plaint.\n---\nRappel : la boutique ferme à 18h vendredi."
            }
          />
        </Field>
      </Section>

      <div className="bg-background sticky bottom-0 -mx-6 flex flex-wrap items-center gap-3 border-t px-6 py-3">
        {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}

        <div className="ml-auto flex items-center gap-2">
          {!creating ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setCreating(true);
                  setDraft(EMPTY_BRAND);
                }}
              >
                <Plus className="size-4" />
                Nouvelle marque
              </Button>

              {brand && brands.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive gap-2"
                  onClick={remove}
                  disabled={pending}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                if (brand) setDraft(strip(brand));
              }}
            >
              Annuler
            </Button>
          )}

          <Button type="button" onClick={save} disabled={pending} className="gap-2">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {creating ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Ne garde que les champs éditables, sans les métadonnées de la base. */
function strip(brand: BrandRecord): Brand {
  return {
    name: brand.name,
    sector: brand.sector,
    audience: brand.audience,
    tone: brand.tone,
    avoid: brand.avoid,
    language: brand.language,
    examples: brand.examples,
  };
}
