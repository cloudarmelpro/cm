/**
 * Test de bout en bout des deux agents, contre un serveur qui tourne.
 *
 *   npm run test:agent                    # http://localhost:3000
 *   npm run test:agent -- http://...      # autre URL
 *
 * Ne se contente pas d'un HTTP 200 : la route /api/generate renvoie 200 avec un
 * corps vide quand le modèle échoue (le statut est déjà parti). On vérifie donc
 * le contenu, réseau par réseau.
 */

const BASE = process.argv[2] ?? process.env.CM_TEST_URL ?? "http://localhost:3000";

// [limite de caracteres, min hashtags, max hashtags] — doit refleter src/lib/networks.ts
const SPECS = {
  instagram: [2200, 5, 10],
  facebook: [2000, 0, 3],
  linkedin: [3000, 3, 5],
  x: [280, 0, 2],
  tiktok: [2200, 3, 5],
  youtube: [5000, 3, 5],
};
const LIMITS = Object.fromEntries(
  Object.entries(SPECS).map(([k, v]) => [k, v[0]]),
);

const BRAND = {
  name: "Maison Kola",
  sector: "torréfaction artisanale, vente de café en ligne et en boutique",
  audience: "25-40 ans, urbains, sensibles au made in local",
  tone: "chaleureux, direct, un peu d'humour",
  avoid: "ne jamais citer un concurrent, pas de promesse de livraison en 24h",
  language: "français",
  examples:
    "On a torréfié 40 kg ce matin. L'atelier sent le caramel et personne ne s'en plaint.\n---\nRappel : la boutique ferme à 18h vendredi, on part tous au marché de Bonanjo.",
};

let failures = 0;

function check(ok, label, detail = "") {
  console.log(`  ${ok ? "OK  " : "ECHEC"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Les six posts partagent le meme angle. S'ils en recopient les mots, la marque
 * publie six variantes de la meme phrase le meme jour.
 *
 * Piege : les faits AUSSI se repetent, et c'est normal — la date, l'horaire et
 * la remise doivent figurer partout. Signaler "de 9h a 12h" comme une formule
 * recopiee ferait echouer toute campagne legitime. On ne retient donc que les
 * suites de 4 mots qui ne contiennent ni chiffre ni mot issu du brief.
 */
function checkNoRepetition(posts, brief) {
  const factWords = new Set(normalize(brief));
  const seen = new Map();

  for (const p of posts) {
    const words = normalize([p.hook, p.body].join(" "));
    const grams = new Set();
    for (let i = 0; i + 4 <= words.length; i++) {
      const gram = words.slice(i, i + 4);
      const factual =
        gram.some((w) => /\d/.test(w)) || gram.some((w) => factWords.has(w));
      if (!factual) grams.add(gram.join(" "));
    }
    for (const g of grams) {
      seen.set(g, (seen.get(g) ?? 0) + 1);
    }
  }

  const shared = [...seen.entries()]
    .filter(([, n]) => n >= 3)
    .map(([g]) => g)
    .slice(0, 5);

  check(
    shared.length === 0,
    "aucune formule de style recopiee sur 3+ reseaux",
    shared.map((s) => `"${s}"`).join(", "),
  );
}

/** Les placeholders doivent tous suivre la meme convention : [... a confirmer]. */
function checkPlaceholders(posts) {
  const bad = [];

  for (const p of posts) {
    const text = [p.hook, p.body, p.cta, p.title].filter(Boolean).join(" ");
    for (const m of text.match(/\[[^\]]+\]/g) ?? []) {
      if (!/à confirmer\s*\]$/i.test(m)) bad.push(`${p.network}: ${m}`);
    }
  }

  check(bad.length === 0, "placeholders au format attendu", bad.join(", "));
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function testGenerate() {
  console.log("\n== Generation de campagne ==");
  const networks = Object.keys(LIMITS);
  const started = Date.now();

  const TOPIC =
    "ouverture d'une deuxième boutique à Douala, quartier Akwa, le 15 septembre";
  const EXTRA =
    "-20% sur tout le jour de l'ouverture, dégustation gratuite de 9h à 12h";

  const { status, text } = await post("/api/generate", {
    brand: BRAND,
    networks,
    topic: TOPIC,
    goal: "trafic",
    extra: EXTRA,
  });

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`  HTTP ${status} en ${seconds}s, ${text.length} caracteres`);

  if (status !== 200) {
    check(false, "statut HTTP", text.slice(0, 200));
    return;
  }
  if (text.trim().length === 0) {
    check(
      false,
      "corps de reponse vide",
      "le modele a echoue — voir le terminal du serveur, prefixe [cm/generate]",
    );
    return;
  }

  let data;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    check(false, "JSON valide", e.message);
    return;
  }

  check(Boolean(data.angle), "angle editorial present");
  checkNoRepetition(data.posts ?? [], `${TOPIC} ${EXTRA} ${BRAND.name} ${BRAND.sector}`);
  checkPlaceholders(data.posts ?? []);
  check(
    data.posts?.length === networks.length,
    "un post par reseau",
    `${data.posts?.length ?? 0}/${networks.length}`,
  );

  for (const post of data.posts ?? []) {
    const [limit, minTags, maxTags] = SPECS[post.network];
    const len = [post.hook, post.body].filter(Boolean).join("\n\n").length;

    check(len <= limit, `${post.network} respecte la limite`, `${len}/${limit}`);
    check(Boolean(post.hook && post.body && post.cta), `${post.network} complet`);

    const tags = post.hashtags?.length ?? 0;
    check(
      tags >= minTags && tags <= maxTags,
      `${post.network} nombre de hashtags`,
      `${tags} (attendu ${minTags}-${maxTags})`,
    );

    const malformed = (post.hashtags ?? []).filter((t) => /[\s#]/.test(t));
    check(
      malformed.length === 0,
      `${post.network} hashtags bien formes`,
      malformed.join(", "),
    );

    check(
      post.hookAlternatives?.length >= 2,
      `${post.network} propose des accroches alternatives`,
      `${post.hookAlternatives?.length ?? 0}`,
    );

    // Deux accroches identiques a la casse pres = le modele a reformule au lieu
    // de proposer un autre angle.
    const hooks = [post.hook, ...(post.hookAlternatives ?? [])].map((h) =>
      String(h).toLowerCase().trim(),
    );
    check(
      new Set(hooks).size === hooks.length,
      `${post.network} accroches distinctes`,
    );

    if (post.network === "tiktok" || post.network === "youtube") {
      check(post.script?.length > 0, `${post.network} a un script video`);
    }
    if (post.network === "youtube") {
      check(Boolean(post.title), "youtube a un titre");
    }
    if (post.network !== "youtube") {
      check(!post.title, `${post.network} n'a pas de titre parasite`);
    }
  }
}

async function testReply() {
  console.log("\n== Reponse a un message de crise ==");

  const { status, text } = await post("/api/reply", {
    brand: BRAND,
    network: "instagram",
    message:
      "Commande payée il y a 12 jours, toujours rien. Si je n'ai pas de réponse aujourd'hui je fais opposition et je publie partout que vous êtes des arnaqueurs. Commande 4471, carte finissant par 8823.",
    context: "retard fournisseur connu, expéditions reprises depuis lundi",
  });

  console.log(`  HTTP ${status}`);
  if (status !== 200) {
    check(false, "statut HTTP", text.slice(0, 200));
    return;
  }

  const data = JSON.parse(text.replace(/^﻿/, ""));
  console.log(
    `  sentiment=${data.sentiment} priorite=${data.priority} canal=${data.publicOrPrivate} escalade=${data.escalate}`,
  );

  // Le message contient une menace et des donnees bancaires : l'agent doit
  // escalader et basculer en prive. C'est le garde-fou principal.
  check(data.escalate === true, "escalade vers un humain");
  check(data.publicOrPrivate === "prive", "bascule en message prive");
  check(
    ["negatif", "crise"].includes(data.sentiment),
    "sentiment negatif detecte",
    data.sentiment,
  );
  check(data.replies?.length >= 2, "au moins 2 variantes de reponse");

  const promesses = /rembours|24h|48h|d[ée]lai garanti|geste commercial/i;
  const risquee = data.replies?.find((r) => promesses.test(r.text));
  check(!risquee, "aucune promesse non validee", risquee?.text?.slice(0, 80) ?? "");
}

console.log(`Cible : ${BASE}`);

try {
  await fetch(BASE);
} catch {
  console.error(`\nServeur injoignable sur ${BASE}. Lance "npm run dev" d'abord.`);
  process.exit(1);
}

await testGenerate();
await testReply();

console.log(
  failures === 0
    ? "\nTous les controles passent."
    : `\n${failures} controle(s) en echec.`,
);
process.exit(failures === 0 ? 0 : 1);
