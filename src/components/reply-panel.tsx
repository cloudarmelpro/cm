"use client";

import { useState } from "react";
import { CopyButton, Field, Select, Textarea } from "@/components/ui";
import { NETWORK_LIST, type NetworkId } from "@/lib/networks";
import type { Brand, Reply } from "@/lib/schema";

const SENTIMENT_STYLE: Record<Reply["sentiment"], string> = {
  positif: "bg-emerald-950 text-emerald-300",
  neutre: "bg-neutral-800 text-neutral-300",
  negatif: "bg-amber-950 text-amber-300",
  crise: "bg-red-950 text-red-300",
};

const PRIORITY_STYLE: Record<Reply["priority"], string> = {
  basse: "bg-neutral-800 text-neutral-400",
  normale: "bg-sky-950 text-sky-300",
  haute: "bg-amber-950 text-amber-300",
  urgente: "bg-red-950 text-red-300",
};

export function ReplyPanel({ brand }: { brand: Brand }) {
  const [network, setNetwork] = useState<NetworkId>("instagram");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!brand.name.trim()) {
      setError("Renseigne au moins le nom de l'entreprise dans le profil.");
      return;
    }
    if (message.trim().length < 2) {
      setError("Colle le message reçu.");
      return;
    }

    setError(null);
    setLoading(true);
    setReply(null);

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, network, message, context }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Requête refusée");
      setReply(data as Reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5"
      >
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <Field label="Réseau">
            <Select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkId)}
            >
              {NETWORK_LIST.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Message reçu" hint="Commentaire, DM, avis, mention.">
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. Commande passée il y a 10 jours, toujours rien et personne ne répond au téléphone."
            />
          </Field>
        </div>

        <Field
          label="Contexte interne"
          hint="Ce que l'agent doit savoir : historique client, statut de la commande, position officielle."
        >
          <Textarea
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ex. retard fournisseur connu, expéditions reprises depuis lundi"
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyse…" : "Proposer une réponse"}
          </button>
          {error ? <span className="text-sm text-red-400">{error}</span> : null}
        </div>
      </form>

      {reply ? (
        <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={SENTIMENT_STYLE[reply.sentiment]}>
              {reply.sentiment}
            </Badge>
            <Badge className={PRIORITY_STYLE[reply.priority]}>
              priorité {reply.priority}
            </Badge>
            <Badge className="bg-neutral-800 text-neutral-300">
              {reply.publicOrPrivate === "prive"
                ? "à basculer en privé"
                : "réponse publique"}
            </Badge>
            {reply.escalate ? (
              <Badge className="bg-red-950 text-red-300">à escalader</Badge>
            ) : null}
          </div>

          <div>
            <Label>Intention détectée</Label>
            <p className="text-sm text-neutral-200">{reply.intent}</p>
          </div>

          {reply.escalate && reply.escalateReason ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3">
              <Label>Pourquoi escalader</Label>
              <p className="text-sm text-red-200">{reply.escalateReason}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <Label>Réponses proposées</Label>
            {reply.replies.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-neutral-400 uppercase">
                    {r.style}
                  </span>
                  <CopyButton text={r.text} />
                </div>
                <p className="text-sm whitespace-pre-wrap text-neutral-100">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
      {children}
    </p>
  );
}
