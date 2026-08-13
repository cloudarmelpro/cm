"use client";

import { useObject } from "@ai-sdk/react";
import { useState } from "react";
import { PostCard } from "@/components/post-card";
import { Field, Select, Textarea } from "@/components/ui";
import { NETWORKS, NETWORK_LIST, type NetworkId } from "@/lib/networks";
import { GOALS, campaignSchema, type Brand } from "@/lib/schema";

type Goal = keyof typeof GOALS;

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
          "L'agent n'a rien renvoyé. Cause probable : quota ou accès modèle refusé — regarde le terminal du serveur pour le détail.",
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
      current.includes(id)
        ? current.filter((n) => n !== id)
        : [...current, id],
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!brand.name.trim()) {
      setFormError("Renseigne au moins le nom de l'entreprise dans le profil.");
      return;
    }
    if (topic.trim().length < 3) {
      setFormError("Décris le sujet du post.");
      return;
    }
    if (networks.length === 0) {
      setFormError("Sélectionne au moins un réseau.");
      return;
    }

    setFormError(null);
    setStreamError(null);
    submit({ brand, networks, topic, goal, extra });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5"
      >
        <Field
          label="Sujet à publier"
          hint="Une actu, un produit, une coulisse, une prise de position…"
        >
          <Textarea
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex. on ouvre une deuxième boutique à Douala le 15 septembre"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Objectif">
            <Select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
            >
              {Object.entries(GOALS).map(([value, g]) => (
                <option key={value} value={value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Précisions" hint="Chiffres, dates, lien, offre…">
            <Textarea
              rows={1}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Ex. -20% le jour de l'ouverture, lien vers maisonkola.cm"
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Réseaux
          </p>
          <div className="flex flex-wrap gap-2">
            {NETWORK_LIST.map((n) => {
              const active = networks.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggle(n.id)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-transparent bg-gradient-to-r text-white " + n.accent
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                  }`}
                >
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "L'agent rédige…" : "Générer les posts"}
          </button>

          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 transition hover:border-neutral-600"
            >
              Arrêter
            </button>
          ) : null}

          {formError ? (
            <span className="text-sm text-amber-400">{formError}</span>
          ) : null}
          {error ? (
            <span className="text-sm text-red-400">
              Erreur : {error.message}
            </span>
          ) : null}
        </div>

        {streamError ? (
          <p className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
            {streamError}
          </p>
        ) : null}
      </form>

      {object?.angle ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
            Angle éditorial
          </p>
          <p className="text-sm text-neutral-200">{object.angle}</p>
        </div>
      ) : null}

      {object?.failed?.length ? (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-amber-400 uppercase">
            {object.failed.length} réseau(x) non généré(s)
          </p>
          <ul className="space-y-1 text-sm text-amber-200">
            {object.failed.filter(Boolean).map((f, i) => (
              <li key={i}>
                <span className="font-medium">
                  {f?.network ? (NETWORKS[f.network]?.label ?? f.network) : "?"}
                </span>{" "}
                — {f?.reason?.includes("quota") || f?.reason?.includes("429")
                  ? "quota du modèle dépassé, réessaie dans une minute"
                  : f?.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {object?.posts?.filter(Boolean).map((post, i) => (
          <PostCard key={post?.network ?? i} post={post ?? {}} />
        ))}
      </div>
    </div>
  );
}
