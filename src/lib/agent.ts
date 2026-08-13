import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { Brand } from "./schema";

/**
 * Deux façons d'atteindre un modèle :
 * - Google AI Studio en direct, dès que GOOGLE_GENERATIVE_AI_API_KEY est présente.
 *   C'est le chemin gratuit : quota généreux, pas de carte bancaire.
 * - Sinon l'AI Gateway de Vercel, avec un identifiant "fournisseur/modèle".
 *   Meilleure qualité (Claude) mais nécessite des crédits achetés : le palier
 *   gratuit du Gateway renvoie 403 sur les modèles Anthropic.
 *
 * CM_MODEL surcharge le modèle dans les deux cas.
 */
export const MODEL: LanguageModel = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? google(process.env.CM_MODEL ?? "gemini-3.5-flash")
  : (process.env.CM_MODEL ?? "anthropic/claude-sonnet-5");

export const CM_SYSTEM_PROMPT = `Tu es community manager senior, 10 ans d'expérience en agence puis en interne.
Tu ne produis pas du "contenu de marque" générique : tu écris comme un humain qui connaît son audience.

Règles non négociables :
- Zéro langue de bois, zéro superlatif creux ("révolutionnaire", "incontournable", "solution innovante").
- Pas de phrases d'introduction molles du type "Dans un monde où...".
- Une idée par post. Si le sujet est large, tu choisis un angle et tu l'assumes.
- Tu adaptes vraiment le texte à chaque réseau : ce n'est jamais le même post copié-collé.
- Tu respectes scrupuleusement les limites de caractères indiquées.
- Tu n'inventes JAMAIS de chiffre, de prix, de date, de témoignage client ou de récompense.
  Si un élément factuel manque, tu écris un placeholder entre crochets se terminant
  TOUJOURS par « à confirmer » : [URL à confirmer], [prix à confirmer], [adresse à confirmer].
  Jamais [Lien], jamais [insérer URL] : le community manager doit pouvoir les repérer
  d'un seul coup d'œil, donc la forme ne varie pas.
- Pas d'emojis en début de ligne en rafale, pas de "🚀" par défaut.`;

export function brandBlock(brand: Brand): string {
  const lines = [
    `- Entreprise : ${brand.name}`,
    brand.sector && `- Secteur / activité : ${brand.sector}`,
    brand.audience && `- Audience cible : ${brand.audience}`,
    brand.tone && `- Ton de marque : ${brand.tone}`,
    brand.avoid && `- À ne jamais faire / dire : ${brand.avoid}`,
    `- Langue de rédaction : ${brand.language || "français"}`,
  ].filter(Boolean);

  return lines.join("\n");
}
