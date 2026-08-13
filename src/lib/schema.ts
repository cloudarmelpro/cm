import { z } from "zod";
import { NETWORK_IDS } from "./networks";

export const brandSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis").max(120),
  sector: z.string().max(500).default(""),
  audience: z.string().max(500).default(""),
  tone: z.string().max(500).default(""),
  /** Ce qu'on ne dit jamais : concurrents, promesses interdites, mots bannis. */
  avoid: z.string().max(1000).default(""),
  language: z.string().max(50).default("français"),
  /**
   * Publications existantes collées par l'utilisateur. Décrire un ton en mots
   * ("chaleureux, direct") reste vague ; deux vrais posts valent mieux que
   * dix adjectifs, le modèle imite une voix au lieu de l'inventer.
   */
  examples: z.string().max(5000).default(""),
});

export type Brand = z.infer<typeof brandSchema>;

export const scriptBeatSchema = z.object({
  timecode: z.string().describe('Repère temporel, ex. "0-3s" ou "Intro".'),
  says: z.string().describe("Ce qui est dit, mot pour mot."),
  shows: z.string().describe("Ce qu'on voit à l'écran."),
});

export const postSchema = z.object({
  network: z.enum(NETWORK_IDS).describe("Le réseau ciblé par ce post."),
  title: z
    .string()
    .nullable()
    .describe("Titre. Obligatoire pour YouTube, null pour les autres réseaux."),
  hook: z
    .string()
    .describe("Accroche : la toute première ligne, celle qui stoppe le scroll."),
  hookAlternatives: z
    .array(z.string())
    .describe(
      "Exactement 2 autres accroches, d'angles nettement différents de la principale. Pas des reformulations.",
    ),
  body: z
    .string()
    .describe(
      "Corps du post, prêt à publier, sans les hashtags et sans répéter l'accroche.",
    ),
  cta: z.string().describe("Appel à l'action, une phrase."),
  hashtags: z
    .array(z.string())
    .describe('Hashtags sans le caractère "#", en minuscules.'),
  visualIdea: z
    .string()
    .describe("Brief visuel concret pour le graphiste ou le tournage."),
  script: z
    .array(scriptBeatSchema)
    .nullable()
    .describe("Script vidéo. Obligatoire pour TikTok et YouTube, null sinon."),
});

export type Post = z.infer<typeof postSchema>;

export const campaignSchema = z.object({
  angle: z
    .string()
    .describe("L'angle éditorial retenu, expliqué en une ou deux phrases."),
  posts: z.array(postSchema).describe("Un post par réseau demandé, dans l'ordre."),
  /**
   * Réseaux dont la rédaction a échoué. Sans ce champ, l'interface afficherait
   * trois cartes au lieu de six sans que personne ne le remarque.
   */
  failed: z
    .array(z.object({ network: z.enum(NETWORK_IDS), reason: z.string() }))
    .default([]),
});

export type Campaign = z.infer<typeof campaignSchema>;

/**
 * Étape 1 de la génération : un appel court qui fixe la ligne éditoriale.
 * Les six posts sont ensuite écrits en parallèle à partir de ce socle, chacun
 * avec toute l'attention du modèle — au lieu d'un unique appel qui s'essouffle
 * sur les derniers réseaux.
 */
export const briefSchema = z.object({
  angle: z
    .string()
    .describe("L'angle éditorial retenu, expliqué en une ou deux phrases."),
  keyMessage: z
    .string()
    .describe("Le message unique à faire passer, en une phrase."),
  facts: z
    .array(z.string())
    .describe(
      "Les faits vérifiables tirés du brief : dates, offres, lieux. Ne rien ajouter qui n'y figure pas.",
    ),
  avoidAngles: z
    .array(z.string())
    .describe("2 angles convenus à éviter parce que tout le monde les fait."),
});

export type Brief = z.infer<typeof briefSchema>;

export const generateRequestSchema = z.object({
  brand: brandSchema,
  networks: z.array(z.enum(NETWORK_IDS)).min(1, "Choisis au moins un réseau"),
  topic: z.string().min(3, "Décris le sujet du post").max(2000),
  goal: z.enum(["notoriete", "engagement", "trafic", "conversion", "recrutement"]),
  extra: z.string().max(2000).default(""),
});

export const GOALS: Record<
  z.infer<typeof generateRequestSchema>["goal"],
  { label: string; brief: string }
> = {
  notoriete: {
    label: "Notoriété",
    brief: "faire connaître la marque, maximiser la portée et la mémorisation",
  },
  engagement: {
    label: "Engagement",
    brief: "déclencher commentaires, partages et discussions dans la communauté",
  },
  trafic: {
    label: "Trafic",
    brief: "faire cliquer vers le site ou une page précise",
  },
  conversion: {
    label: "Conversion",
    brief: "déclencher un achat, une demande de devis ou une inscription",
  },
  recrutement: {
    label: "Marque employeur",
    brief: "attirer des candidats et valoriser les équipes",
  },
};

/* ---------- Agent « réponse aux commentaires / DM » ---------- */

export const replySchema = z.object({
  sentiment: z
    .enum(["positif", "neutre", "negatif", "crise"])
    .describe("Tonalité du message reçu."),
  intent: z
    .string()
    .describe("Ce que la personne veut vraiment, en une phrase."),
  priority: z
    .enum(["basse", "normale", "haute", "urgente"])
    .describe("Priorité de traitement."),
  escalate: z
    .boolean()
    .describe(
      "true si un humain (SAV, juridique, direction) doit reprendre la main.",
    ),
  escalateReason: z
    .string()
    .nullable()
    .describe("Pourquoi escalader. null si escalate est false."),
  replies: z
    .array(
      z.object({
        style: z
          .string()
          .describe('Style de la réponse, ex. "empathique", "factuel", "léger".'),
        text: z.string().describe("La réponse, prête à être publiée."),
      }),
    )
    .describe("2 ou 3 variantes de réponse."),
  publicOrPrivate: z
    .enum(["public", "prive"])
    .describe(
      "Répondre publiquement ou basculer en message privé (litige, données personnelles).",
    ),
});

export type Reply = z.infer<typeof replySchema>;

export const replyRequestSchema = z.object({
  brand: brandSchema,
  network: z.enum(NETWORK_IDS),
  message: z.string().min(2, "Colle le message reçu").max(5000),
  context: z.string().max(2000).default(""),
});
