export const NETWORK_IDS = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "tiktok",
  "youtube",
] as const;

export type NetworkId = (typeof NETWORK_IDS)[number];

export type NetworkSpec = {
  id: NetworkId;
  label: string;
  /** Longueur max du corps du post, en caractères. */
  maxChars: number;
  /** Longueur qui performe le mieux, à viser par défaut. */
  sweetSpot: string;
  hashtags: string;
  /** Bornes vérifiées par le code, pas par le modèle : [min, max]. */
  hashtagRange: [number, number];
  /** Réseau vidéo : on demande aussi un script à l'agent. */
  video: boolean;
  /** Réseau à titre (YouTube) : on demande aussi un titre. */
  needsTitle: boolean;
  rules: string[];
  accent: string;
};

export const NETWORKS: Record<NetworkId, NetworkSpec> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    maxChars: 2200,
    sweetSpot: "125-300 caractères avant le « plus »",
    hashtags: "5 à 10, en fin de légende",
    hashtagRange: [5, 10],
    video: false,
    needsTitle: false,
    accent: "from-fuchsia-500 to-orange-400",
    rules: [
      "L'accroche doit tenir sur la 1re ligne : c'est tout ce qui est visible avant le « ... plus ».",
      "Ton chaleureux et incarné, tutoiement, émojis autorisés mais dosés (3 à 5 max).",
      "Aucun lien cliquable dans la légende : renvoyer vers le lien en bio.",
      "Sauts de ligne fréquents, phrases courtes, lisible sur mobile.",
    ],
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    maxChars: 2000,
    sweetSpot: "80-250 caractères",
    hashtags: "0 à 3, ou aucun",
    hashtagRange: [0, 3],
    video: false,
    needsTitle: false,
    accent: "from-blue-600 to-sky-400",
    rules: [
      "Ton conversationnel, orienté communauté locale, vouvoiement possible.",
      "Poser une question ouverte pour déclencher les commentaires.",
      "Les liens sont cliquables : le CTA peut pointer vers une URL.",
      "Éviter la surcharge de hashtags, ils performent mal ici.",
    ],
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    maxChars: 3000,
    sweetSpot: "900-1500 caractères",
    hashtags: "3 à 5, professionnels",
    hashtagRange: [3, 5],
    video: false,
    needsTitle: false,
    accent: "from-sky-700 to-cyan-500",
    rules: [
      "Les 2 premières lignes doivent donner envie de cliquer sur « voir plus ».",
      "Ton professionnel mais incarné : storytelling, retour d'expérience, chiffres concrets.",
      "Pas d'émojis décoratifs en rafale ; au plus 1 ou 2, fonctionnels.",
      "Mettre le lien externe en commentaire, pas dans le post : le CTA le mentionne.",
      "Aérer avec des retours à la ligne, une idée par paragraphe.",
    ],
  },
  x: {
    id: "x",
    label: "X (Twitter)",
    maxChars: 280,
    sweetSpot: "180-260 caractères",
    hashtags: "0 à 2 maximum",
    hashtagRange: [0, 2],
    video: false,
    needsTitle: false,
    accent: "from-neutral-700 to-neutral-400",
    rules: [
      "LIMITE STRICTE : le corps du post ne doit JAMAIS dépasser 280 caractères, hashtags compris.",
      "Une seule idée, formulation punchy, pas d'introduction.",
      "Pas d'émojis superflus, pas de « thread » sauf si l'angle l'impose.",
      "Le CTA doit être ultra court (quelques mots).",
    ],
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    maxChars: 2200,
    sweetSpot: "légende de 100-150 caractères",
    hashtags: "3 à 5, dont 1 large et 2 de niche",
    hashtagRange: [3, 5],
    video: true,
    needsTitle: false,
    accent: "from-rose-500 to-teal-400",
    rules: [
      "Fournir un script vidéo : les 3 premières secondes doivent stopper le scroll.",
      "Ton direct, parlé, tutoiement, zéro jargon corporate.",
      "Le script est découpé en beats courts, chacun avec ce qui est dit ET ce qu'on voit.",
      "La légende reste courte, le vrai contenu est dans la vidéo.",
    ],
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    maxChars: 5000,
    sweetSpot: "description de 200-500 caractères utiles en haut",
    hashtags: "3 à 5, orientés recherche",
    hashtagRange: [3, 5],
    video: true,
    needsTitle: true,
    accent: "from-red-600 to-amber-400",
    rules: [
      "Fournir un titre de 60 caractères max, optimisé recherche, sans clickbait mensonger.",
      "Les 150 premiers caractères de la description sont visibles avant le « plus » : y placer l'essentiel + le mot-clé principal.",
      "Fournir un script structuré : hook, promesse, développement, conclusion + CTA abonnement.",
      "Ton pédagogique, orienté valeur et rétention.",
    ],
  },
};

export const NETWORK_LIST: NetworkSpec[] = NETWORK_IDS.map((id) => NETWORKS[id]);

export function isNetworkId(value: string): value is NetworkId {
  return (NETWORK_IDS as readonly string[]).includes(value);
}

/** Bloc de contraintes injecté dans le prompt système, réseau par réseau. */
export function networkBriefing(ids: NetworkId[]): string {
  return ids
    .map((id) => {
      const n = NETWORKS[id];
      return [
        `### ${n.label} (id: "${n.id}")`,
        `- Longueur max du corps : ${n.maxChars} caractères. Cible : ${n.sweetSpot}.`,
        `- Hashtags : ${n.hashtags}.`,
        n.needsTitle ? `- Champ "title" OBLIGATOIRE.` : `- Champ "title" : laisser null.`,
        n.video
          ? `- Champ "script" OBLIGATOIRE (3 à 6 beats).`
          : `- Champ "script" : laisser null.`,
        ...n.rules.map((r) => `- ${r}`),
      ].join("\n");
    })
    .join("\n\n");
}
