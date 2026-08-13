import { Output, generateText } from "ai";
import { CM_SYSTEM_PROMPT, MODEL, brandBlock } from "@/lib/agent";
import { NETWORKS } from "@/lib/networks";
import { replyRequestSchema, replySchema } from "@/lib/schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  const parsed = replyRequestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Requête invalide", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { brand, network, message, context } = parsed.data;

  try {
    const { output } = await generateText({
      model: MODEL,
      system: `${CM_SYSTEM_PROMPT}

Ici tu ne rédiges pas un post : tu réponds à un message reçu sur les réseaux, au nom de la marque.
- Tu réponds court : 2 à 4 phrases maximum, sauf si la question technique impose plus.
- Tu ne promets jamais un geste commercial, un remboursement ou un délai que la marque n'a pas validé.
- Face à une critique fondée : tu reconnais, tu remercies, tu proposes une suite concrète.
- Face à un troll ou une attaque gratuite : réponse courte, factuelle, sans ironie, ou pas de réponse publique.
- Si le message contient des données personnelles, un litige, un problème de paiement ou de santé,
  tu bascules en privé et tu escalades.`,
      output: Output.object({ schema: replySchema }),
      prompt: `## La marque
${brandBlock(brand)}

## Contexte
Réseau : ${NETWORKS[network].label}
${context ? `Historique / précisions : ${context}` : "Pas d'historique fourni."}

## Message reçu
"""
${message}
"""

Analyse ce message, puis propose des réponses prêtes à publier.`,
    });

    return Response.json(output);
  } catch (error) {
    console.error("[cm/reply]", error);
    return Response.json(
      { error: "L'agent n'a pas réussi à générer une réponse." },
      { status: 500 },
    );
  }
}
