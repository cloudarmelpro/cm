"use client";

import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reinitialiser",
    });

    setLoading(false);
    // On confirme toujours, même si l'adresse est inconnue : répondre
    // différemment révélerait quelles adresses possèdent un compte.
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="E-mail envoyé"
        description="Si un compte existe pour cette adresse, le lien est parti."
      >
        <div className="border-primary/30 bg-accent/50 rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MailCheck className="size-4" />
            Vérifiez votre boîte de réception
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Le lien de réinitialisation expire au bout d&apos;une heure.
          </p>
        </div>
        <Link
          href="/connexion"
          className="text-muted-foreground hover:text-foreground mt-4 block text-sm"
        >
          Retour à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Nous vous enverrons un lien pour en choisir un nouveau."
      footer={
        <Link href="/connexion" className="text-primary font-medium">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Adresse e-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Envoyer le lien
        </Button>
      </form>
    </AuthShell>
  );
}
