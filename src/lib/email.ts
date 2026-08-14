import { waitUntil } from "@vercel/functions";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "CM <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Envoi d'un e-mail transactionnel.
 *
 * Sans clé Resend — le cas en développement — le message n'est pas envoyé : le
 * lien est écrit dans le terminal. C'est volontaire. Tant qu'un nom de domaine
 * n'est pas vérifié chez Resend, l'envoi n'est autorisé que vers l'adresse du
 * propriétaire du compte ; toute autre destination renvoie 403. Personne ne
 * pourrait donc s'inscrire.
 *
 * L'appel n'est jamais attendu : la documentation Better Auth le déconseille
 * explicitement, pour ne pas laisser mesurer si une adresse existe. Sur Vercel,
 * `waitUntil` garantit que l'envoi aboutit malgré tout avant que la fonction ne
 * soit gelée.
 */
export function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): void {
  if (!resend) {
    console.log(
      `\n[cm/email] Envoi désactivé (RESEND_API_KEY absente).\n  Pour : ${to}\n  Objet : ${subject}\n  ${text}\n`,
    );
    return;
  }

  waitUntil(
    resend.emails
      .send({ from, to, subject, text })
      .then(({ error }) => {
        if (error) console.error("[cm/email]", error);
      })
      .catch((error: unknown) => console.error("[cm/email]", error)),
  );
}
