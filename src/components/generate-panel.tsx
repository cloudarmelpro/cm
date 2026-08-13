"use client";

import { useObject } from "@ai-sdk/react";
import {
  Briefcase,
  Loader2,
  Megaphone,
  MessagesSquare,
  MousePointerClick,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { PostCard } from "@/components/post-card";
import { Field, Section, SelectableCard } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NETWORKS, NETWORK_LIST, type NetworkId } from "@/lib/networks";
import { GOALS, campaignSchema, type Brand } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Goal = keyof typeof GOALS;

const GOAL_ICONS: Record<Goal, React.ReactNode> = {
  notoriete: <Megaphone />,
  engagement: <MessagesSquare />,
  trafic: <MousePointerClick />,
  conversion: <ShoppingCart />,
  recrutement: <Briefcase />,
};

export function GeneratePanel({ brand }: { brand: Brand }) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [extra, setExtra] = useState("");
  const [networks, setNetworks] = useState<NetworkId[]>([
    "instagram",
    "linkedin",
    "x",
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/generate",
    schema: campaignSchema,
    onFinish({ object: result }) {
      // Le flux peut se terminer vide : le modèle a échoué côté serveur
      // (quota, accès refusé) sans que le statut HTTP puisse encore changer.
      if (!result) {
        setStreamError(
          "L'agent n'a rien renvoyé. Cause probable : quota ou accès modèle refusé — le détail est dans le terminal du serveur.",
        );
      } else if (result.posts.length === 0) {
        setStreamError("Aucun réseau n'a pu être généré.");
      } else {
        setStreamError(null);
      }
    },
  });

  function toggle(id: NetworkId) {
    setNetworks((current) =>
      current.includes(id) ? current.filter((n) => n !== id) : [...current, id],
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!brand.name.trim()) {
      setFormError("Renseignez au moins le nom de l'entreprise dans le profil.");
      return;
    }
    if (topic.trim().length < 3) {
      setFormError("Décrivez le sujet du post.");
      return;
    }
    if (networks.length === 0) {
      setFormError("Sélectionnez au moins un réseau.");
      return;
    }

    setFormError(null);
    setStreamError(null);
    submit({ brand, networks, topic, goal, extra });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <Section
        title="Sujet à publier"
        description="Une actualité, un produit, une coulisse, une prise de position."
      >
        <Textarea
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="On ouvre une deuxième boutique à Douala le 15 septembre"
        />

        <Field
          label="Précisions"
          hint="Chiffres, dates, offre, lien. L'agent n'invente rien : ce qui manque sortira en [à confirmer]."
        >
          <Textarea
            rows={2}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="-20% le jour de l'ouverture, dégustation gratuite de 9h à 12h"
          />
        </Field>
      </Section>

      <Separator />

      <Section
        title="Objectif"
        description="Il oriente la structure du post et l'appel à l'action."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(GOALS).map(([value, g]) => (
            <SelectableCard
              key={value}
              selected={goal === value}
              onSelect={() => setGoal(value as Goal)}
              icon={GOAL_ICONS[value as Goal]}
              title={g.label}
              description={g.brief}
            />
          ))}
        </div>
      </Section>

      <Separator />

      <Section
        title="Réseaux"
        description="Un post distinct par réseau, adapté à ses contraintes de longueur et de format."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NETWORK_LIST.map((n) => {
            const active = networks.includes(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id)}
                aria-pressed={active}
                className={cn(
                  "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition focus-visible:ring-[3px] focus-visible:outline-none",
                  active
                    ? "border-primary bg-accent/60"
                    : "border-border bg-card hover:border-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full bg-gradient-to-br",
                    n.accent,
                  )}
                />
                <span className="text-sm font-medium">{n.label}</span>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {n.maxChars}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {object?.angle ? (
        <div className="bg-accent/50 border-primary/25 rounded-lg border p-4">
          <p className="text-accent-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Angle éditorial
          </p>
          <p className="text-sm">{object.angle}</p>
        </div>
      ) : null}

      {object?.failed?.length ? (
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
          <p className="text-destructive mb-1 flex items-center gap-1.5 text-sm font-medium">
            <TriangleAlert className="size-4" />
            {object.failed.length} réseau(x) non généré(s)
          </p>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {object.failed.filter(Boolean).map((f, i) => (
              <li key={i}>
                <span className="text-foreground font-medium">
                  {f?.network ? (NETWORKS[f.network]?.label ?? f.network) : "?"}
                </span>{" "}
                —{" "}
                {f?.reason?.includes("quota") || f?.reason?.includes("429")
                  ? "quota du modèle dépassé, réessayez dans une minute"
                  : f?.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {object?.posts?.length ? (
        <div className="space-y-4">
          {object.posts.filter(Boolean).map((post, i) => (
            <PostCard key={post?.network ?? i} post={post ?? {}} />
          ))}
        </div>
      ) : null}

      {/* Barre d'action en dernier : une barre collée se fixe au bas de l'écran
          dès que sa position naturelle passe sous la ligne de flottaison. Placée
          au milieu du formulaire, elle recouvrait en permanence la section qui
          se trouvait dessous. */}
      <div className="bg-background sticky bottom-0 -mx-6 border-t px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground text-sm">
            {networks.length === 0
              ? "Aucun réseau sélectionné"
              : `${networks.length} réseau${networks.length > 1 ? "x" : ""} sélectionné${networks.length > 1 ? "s" : ""}`}
          </p>

          <div className="ml-auto flex items-center gap-2">
            {isLoading ? (
              <Button type="button" variant="ghost" onClick={stop}>
                Arrêter
              </Button>
            ) : null}
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isLoading ? "Rédaction en cours…" : "Générer les posts"}
            </Button>
          </div>
        </div>

        {formError || error || streamError ? (
          <p className="text-destructive mt-2 text-sm">
            {formError ?? streamError ?? error?.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
