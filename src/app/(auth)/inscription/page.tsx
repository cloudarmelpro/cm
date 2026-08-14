"use client";

import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function InscriptionPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);

    if (error) {
      setError(
        error.code === "USER_ALREADY_EXISTS"
          ? "Un compte existe déjà avec cette adresse."
          : (error.message ?? "La création du compte a échoué."),
      );
      return;
    }

    // Aucune session n'est délivrée : la vérification d'adresse est obligatoire.
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Vérifiez votre adresse"
        description="Une dernière étape avant de commencer."
      >
        <div className="border-primary/30 bg-accent/50 rounded-lg border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MailCheck className="size-4" />
            E-mail envoyé à {email}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ouvrez le lien qu&apos;il contient pour activer votre compte. Sans
            cette confirmation, la connexion reste bloquée.
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
      title="Créer un compte"
      description="Vos marques, vos campagnes, votre historique."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link href="/connexion" className="text-primary font-medium">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nom" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Armel"
          />
        </Field>

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

        <Field
          label="Mot de passe"
          htmlFor="password"
          hint="8 caractères minimum."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
