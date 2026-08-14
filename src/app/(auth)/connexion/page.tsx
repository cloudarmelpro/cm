"use client";

import { Loader2, MailWarning } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [resent, setResent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotVerified(false);

    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);

    if (!error) {
      router.push("/");
      router.refresh();
      return;
    }

    // Le serveur répond 403 EMAIL_NOT_VERIFIED tant que l'adresse n'est pas
    // confirmée. On le traite à part : ce n'est pas une erreur de saisie, et
    // la bonne action est de renvoyer l'e-mail, pas de retaper le mot de passe.
    if (error.code === "EMAIL_NOT_VERIFIED") {
      setNotVerified(true);
      return;
    }

    setError(
      error.code === "INVALID_EMAIL_OR_PASSWORD"
        ? "Adresse e-mail ou mot de passe incorrect."
        : (error.message ?? "La connexion a échoué."),
    );
  }

  async function resend() {
    await authClient.sendVerificationEmail({ email, callbackURL: "/" });
    setResent(true);
  }

  return (
    <AuthShell
      title="Connexion"
      description="Retrouvez vos marques et vos campagnes."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary font-medium">
            Créer un compte
          </Link>
        </>
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

        <Field label="Mot de passe" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {notVerified ? (
          <div className="border-primary/30 bg-accent/50 space-y-2 rounded-lg border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <MailWarning className="size-4" />
              Adresse non vérifiée
            </p>
            <p className="text-muted-foreground text-sm">
              Ouvrez le lien reçu par e-mail pour activer votre compte.
            </p>
            {resent ? (
              <p className="text-sm">Un nouvel e-mail vient d&apos;être envoyé.</p>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={resend}>
                Renvoyer l&apos;e-mail
              </Button>
            )}
          </div>
        ) : null}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Se connecter
        </Button>

        <Link
          href="/mot-de-passe-oublie"
          className="text-muted-foreground hover:text-foreground block text-center text-sm"
        >
          Mot de passe oublié ?
        </Link>
      </form>
    </AuthShell>
  );
}
