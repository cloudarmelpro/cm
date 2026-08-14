import {
  Output,
  createTextStreamResponse,
  generateText,
  streamText,
  toTextStream,
} from "ai";
import { CM_SYSTEM_PROMPT, MODEL, brandBlock } from "./agent";
import { NETWORKS, type NetworkId, networkBriefing } from "./networks";
import { recordUsage } from "./quota";
import {
  GOALS,
  type Brand,
  type Brief,
  type Post,
  briefSchema,
  campaignSchema,
  postSchema,
} from "./schema";

type Input = {
  brand: Brand;
  networks: NetworkId[];
  topic: string;
  goal: keyof typeof GOALS;
  extra: string;
  /** Propriétaire de la consommation. Absent hors contexte authentifié. */
  organizationId?: string;
  userId?: string | null;
};

/**
 * Enregistre un appel modèle abouti.
 *
 * Appelé après coup, jamais avant : un réseau qui échoue en 429 n'a rien coûté
 * et ne doit pas être décompté. Une panne de comptabilité ne doit pas non plus
 * faire échouer une génération réussie, d'où le `catch`.
 */
async function bill(
  input: Input,
  kind: "brief" | "post" | "repair",
  network?: NetworkId,
): Promise<void> {
  if (!input.organizationId) return;

  try {
    await recordUsage({
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      kind,
      network: network ?? null,
      model: typeof MODEL === "string" ? MODEL : "google",
    });
  } catch (error) {
    console.error("[cm/usage]", error);
  }
}

/* ------------------------------------------------------------------ */
/* Contrôles déterministes                                             */
/* ------------------------------------------------------------------ */

/**
 * Ce que le code vérifie, le modèle n'a pas à le vérifier. Un LLM compte mal
 * les caractères : lui demander de respecter 280 signes est un vœu, le mesurer
 * ici est un fait. Chaque violation devient une consigne de correction ciblée.
 */
export function findViolations(post: Post): string[] {
  const spec = NETWORKS[post.network];
  const problems: string[] = [];

  const length = [post.hook, post.body].filter(Boolean).join("\n\n").length;
  if (length > spec.maxChars) {
    problems.push(
      `Le post fait ${length} caractères alors que ${spec.label} en autorise ${spec.maxChars}. Raccourcis de ${length - spec.maxChars} caractères au minimum, sans supprimer le fait principal.`,
    );
  }

  const [min, max] = spec.hashtagRange;
  const tags = post.hashtags.length;
  if (tags < min || tags > max) {
    problems.push(
      `Il y a ${tags} hashtags, or ${spec.label} en demande entre ${min} et ${max}.`,
    );
  }

  const malformed = post.hashtags.filter((t) => /[\s#]/.test(t));
  if (malformed.length > 0) {
    problems.push(
      `Ces hashtags contiennent un espace ou un dièse, ce qui est invalide : ${malformed.join(", ")}. Un hashtag est un seul mot, sans "#".`,
    );
  }

  if (spec.needsTitle && !post.title) {
    problems.push(`${spec.label} exige un titre, le champ "title" est vide.`);
  }
  if (!spec.needsTitle && post.title) {
    problems.push(`${spec.label} ne prend pas de titre, mets "title" à null.`);
  }

  if (spec.video && !post.script?.length) {
    problems.push(
      `${spec.label} exige un script vidéo de 3 à 6 beats, le champ "script" est vide.`,
    );
  }
  if (!spec.video && post.script?.length) {
    problems.push(`${spec.label} n'est pas un réseau vidéo, mets "script" à null.`);
  }

  if (post.hookAlternatives.length < 2) {
    problems.push(
      `Il faut exactement 2 accroches alternatives, il y en a ${post.hookAlternatives.length}.`,
    );
  }

  return problems;
}

/* ------------------------------------------------------------------ */
/* Étape 1 : la ligne éditoriale                                       */
/* ------------------------------------------------------------------ */

function brandContext(brand: Brand): string {
  const block = brandBlock(brand);
  if (!brand.examples.trim()) return block;

  return `${block}

## Publications existantes de la marque, à imiter pour la voix
Reproduis ce registre, ce rythme, ce vocabulaire. N'en recopie aucune phrase.
"""
${brand.examples.trim()}
"""`;
}

async function writeBrief(input: Input): Promise<Brief> {
  const { brand, topic, goal, extra } = input;

  const { output } = await generateText({
    model: MODEL,
    system: `${CM_SYSTEM_PROMPT}

Ici tu ne rédiges aucun post. Tu fixes la ligne éditoriale que six déclinaisons vont suivre.
Choisis un angle que la concurrence n'aurait pas pris. Si le sujet est banal, trouve
l'entrée par laquelle il devient intéressant : une conséquence concrète, une coulisse,
un détail vrai. Reste sec et décisif.`,
    output: Output.object({ schema: briefSchema }),
    prompt: `## La marque
${brandContext(brand)}

## La mission
Sujet : ${topic}
Objectif : ${GOALS[goal].label} — ${GOALS[goal].brief}
${extra ? `Contraintes et informations fournies : ${extra}` : "Aucune information chiffrée fournie."}

Extrais les faits vérifiables de ce brief, sans jamais en inventer.`,
  });

  await bill(input, "brief");
  return output;
}

/* ------------------------------------------------------------------ */
/* Étape 2 : un post par réseau, en parallèle                          */
/* ------------------------------------------------------------------ */

function postPrompt(
  input: Input,
  brief: Brief,
  network: NetworkId,
): { system: string; prompt: string } {
  const spec = NETWORKS[network];

  return {
    system: `${CM_SYSTEM_PROMPT}

Tu écris UN SEUL post, pour ${spec.label}, et rien d'autre. Toute ton attention va là.
Le texte doit être publiable tel quel, sans réécriture.`,
    prompt: `## La marque
${brandContext(input.brand)}

## Ligne éditoriale déjà arrêtée
Angle : ${brief.angle}
Message unique : ${brief.keyMessage}
Faits utilisables (n'en invente aucun autre) :
${brief.facts.map((f) => `- ${f}`).join("\n") || "- aucun fait chiffré fourni"}
Angles à éviter car convenus :
${brief.avoidAngles.map((a) => `- ${a}`).join("\n")}

## Objectif
${GOALS[input.goal].label} — ${GOALS[input.goal].brief}

## Contraintes de la plateforme
${networkBriefing([network])}

## Attention : l'angle est une position, pas une formule
Les cinq autres réseaux reçoivent exactement le même angle que toi. Si chacun en recopie
les mots, la marque publie six fois la même phrase le même jour, et cela se voit
immédiatement.

Tu dois donc **exprimer cet angle avec tes propres mots**, sous une forme propre à
${spec.label}. N'emploie aucune tournure de l'angle telle quelle. Si l'angle repose sur
une posture (par exemple refuser un discours convenu), incarne-la par ce que tu racontes
plutôt qu'en la déclarant.

## Accroches
Donne une accroche principale, puis 2 alternatives d'angles franchement différents
— pas des reformulations de la première. Le community manager choisira.`,
  };
}

async function writePost(
  input: Input,
  brief: Brief,
  network: NetworkId,
): Promise<Post> {
  const { system, prompt } = postPrompt(input, brief, network);
  const started = Date.now();

  const { output } = await generateText({
    model: MODEL,
    system,
    output: Output.object({ schema: postSchema }),
    prompt,
  });

  const firstPass = Date.now() - started;
  await bill(input, "post", network);

  const post: Post = { ...output, network };
  const violations = findViolations(post);

  if (violations.length === 0) {
    console.log(`[cm/generate] ${network} ${(firstPass / 1000).toFixed(1)}s`);
    return post;
  }

  console.log(
    `[cm/generate] ${network} ${(firstPass / 1000).toFixed(1)}s puis reparation : ${violations.join(" | ")}`,
  );

  // Une seule passe de réparation : on nomme les défauts mesurés plutôt que de
  // demander au modèle de « vérifier », ce qu'il fait mal sur son propre texte.
  const { output: repaired } = await generateText({
    model: MODEL,
    system,
    output: Output.object({ schema: postSchema }),
    prompt: `${prompt}

## Post à corriger
${JSON.stringify(output, null, 2)}

## Défauts mesurés automatiquement, à corriger tous
${violations.map((v) => `- ${v}`).join("\n")}

Renvoie le post corrigé. Ne change que ce qui doit l'être : garde l'angle, le ton
et les faits. Ne rallonge pas le texte pour compenser.`,
  });

  await bill(input, "repair", network);

  const fixed: Post = { ...repaired, network };
  const remaining = findViolations(fixed);
  console.log(
    `[cm/generate] ${network} reparation terminee en ${((Date.now() - started) / 1000).toFixed(1)}s au total, ${remaining.length} defaut(s) restant(s)`,
  );

  return remaining.length < violations.length ? fixed : post;
}

/* ------------------------------------------------------------------ */
/* Assemblage : flux JSON progressif                                   */
/* ------------------------------------------------------------------ */

/**
 * On construit le document JSON à la main pour émettre chaque post dès qu'il
 * est prêt. `useObject` accumule le texte et le parse en JSON partiel : un
 * document ouvert puis complété au fil de l'eau lui convient, et l'interface
 * voit les cartes apparaître une à une au lieu d'attendre les six.
 */
/**
 * Mode économe : un seul appel produit les six posts.
 *
 * La qualité baisse — l'attention du modèle se dilue et les derniers réseaux
 * sont plus faibles — mais une campagne coûte 1 requête au lieu de 7. Sur le
 * palier gratuit Google, plafonné à une vingtaine de requêtes par jour et par
 * modèle, c'est la différence entre deux campagnes et vingt.
 */
export function streamCampaignSingleCall(input: Input): Response {
  const { brand, networks, topic, goal, extra } = input;

  const result = streamText({
    model: MODEL,
    system: CM_SYSTEM_PROMPT,
    output: Output.object({ schema: campaignSchema }),
    prompt: `## La marque
${brandContext(brand)}

## La mission
Sujet à traiter : ${topic}
Objectif : ${GOALS[goal].label} — ${GOALS[goal].brief}
${extra ? `Contraintes et informations fournies : ${extra}` : ""}

## Réseaux à couvrir (${networks.length})
Un post par réseau, dans cet ordre : ${networks.map((id) => NETWORKS[id].label).join(", ")}.
Soigne autant le dernier que le premier.

${networkBriefing(networks)}

## Attendu
Choisis un angle éditorial unique, puis décline-le réseau par réseau. Pour chaque post,
donne l'accroche principale et 2 alternatives d'angles nettement différents.
Laisse "failed" vide.`,
    onError({ error }) {
      console.error("[cm/generate] appel unique", error);
    },
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
  });
}

/** `CM_PIPELINE=single` bascule sur le mode économe. */
export function isSingleCallMode(): boolean {
  return process.env.CM_PIPELINE === "single";
}

export function streamCampaign(input: Input): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const started = Date.now();
      try {
        const brief = await writeBrief(input);
        console.log(
          `[cm/generate] brief ${((Date.now() - started) / 1000).toFixed(1)}s`,
        );

        controller.enqueue(`{"angle":${JSON.stringify(brief.angle)},"posts":[`);

        const queue = [...input.networks];
        const failed: { network: NetworkId; reason: string }[] = [];
        let written = 0;

        // Les paliers gratuits limitent les requêtes par minute : lancer les six
        // réseaux d'un coup fait tomber la moitié en 429. On les traite par
        // petites vagues. Sur une offre payante, monter CM_CONCURRENCY.
        const limit = Math.max(1, Number(process.env.CM_CONCURRENCY ?? 2));

        async function worker() {
          for (let network = queue.shift(); network; network = queue.shift()) {
            try {
              const post = await writePost(input, brief, network);
              controller.enqueue(
                (written++ > 0 ? "," : "") + JSON.stringify(post),
              );
            } catch (error) {
              // Un réseau qui échoue ne doit pas emporter les autres, mais il
              // doit remonter jusqu'à l'interface.
              const reason =
                error instanceof Error ? error.message : "erreur inconnue";
              console.error(`[cm/generate] ${network} abandonne : ${reason}`);
              failed.push({ network, reason: reason.slice(0, 300) });
            }
          }
        }

        await Promise.all(
          Array.from({ length: Math.min(limit, queue.length) }, worker),
        );

        controller.enqueue(`],"failed":${JSON.stringify(failed)}}`);
        console.log(
          `[cm/generate] campagne complete en ${((Date.now() - started) / 1000).toFixed(1)}s`,
        );
        controller.close();
      } catch (error) {
        console.error("[cm/generate] brief", error);
        controller.error(error);
      }
    },
  });
}
