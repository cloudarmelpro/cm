"use client";

import { Loader2, MessageSquareReply, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { StreamIn } from "@/components/reveal";
import { CopyButton, Field, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NETWORK_LIST, type NetworkId } from "@/lib/networks";
import type { Brand, Reply } from "@/lib/schema";

const SENTIMENT_VARIANT: Record<
  Reply["sentiment"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  positif: "secondary",
  neutre: "outline",
  negatif: "default",
  crise: "destructive",
};

const PRIORITY_VARIANT: Record<
  Reply["priority"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  basse: "outline",
  normale: "secondary",
  haute: "default",
  urgente: "destructive",
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
      setError("Renseignez au moins le nom de l'entreprise dans le profil.");
      return;
    }
    if (message.trim().length < 2) {
      setError("Collez le message reçu.");
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
    <form onSubmit={onSubmit} className="space-y-10">
      <Section
        title="Message reçu"
        description="Commentaire, message privé, avis ou mention à traiter."
      >
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Field label="Réseau">
            <Select
              value={network}
              onValueChange={(v) => setNetwork(v as NetworkId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_LIST.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Contenu du message">
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commande passée il y a 10 jours, toujours rien et personne ne répond au téléphone."
            />
          </Field>
        </div>

        <Field
          label="Contexte interne"
          hint="Ce que l'agent doit savoir : statut réel de la commande, position officielle, historique client."
        >
          <Textarea
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Retard fournisseur connu, expéditions reprises depuis lundi"
          />
        </Field>
      </Section>

      {reply ? (
        <StreamIn>
          <Card className="gap-0 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={SENTIMENT_VARIANT[reply.sentiment]}>
              {reply.sentiment}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[reply.priority]}>
              priorité {reply.priority}
            </Badge>
            <Badge variant="outline">
              {reply.publicOrPrivate === "prive"
                ? "à basculer en privé"
                : "réponse publique"}
            </Badge>
            {reply.escalate ? (
              <Badge variant="destructive" className="gap-1">
                <TriangleAlert className="size-3" />à escalader
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Intention détectée
            </p>
            <p className="text-sm">{reply.intent}</p>
          </div>

          {reply.escalate && reply.escalateReason ? (
            <div className="border-destructive/30 bg-destructive/5 mt-4 rounded-lg border p-3">
              <p className="text-destructive text-xs font-semibold tracking-wide uppercase">
                Pourquoi escalader
              </p>
              <p className="mt-1 text-sm">{reply.escalateReason}</p>
            </div>
          ) : null}

          <Separator className="my-5" />

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Réponses proposées
            </p>
            {reply.replies.map((r, i) => (
              <div key={i} className="bg-muted/40 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    {r.style}
                  </span>
                  <CopyButton text={r.text} />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {r.text}
                </p>
              </div>
              ))}
            </div>
          </Card>
        </StreamIn>
      ) : null}

      {/* En dernier, pour la même raison que dans le panneau de génération. */}
      <div className="bg-background sticky bottom-0 -mx-6 border-t px-6 py-3">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground hidden text-sm sm:block">
            L&apos;agent analyse puis propose des réponses prêtes à publier.
          </p>
          <Button type="submit" disabled={loading} className="ml-auto gap-2">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquareReply className="size-4" />
            )}
            {loading ? "Analyse…" : "Proposer une réponse"}
          </Button>
        </div>
        {error ? (
          <p className="text-destructive mt-2 text-sm">{error}</p>
        ) : null}
      </div>
    </form>
  );
}
