# Exemple de campagne réellement produite

Sortie brute de l'agent, obtenue en remplissant le formulaire dans le navigateur le
13 août 2026. Rien n'a été retouché à la main : c'est ce que l'application affiche.

## Le brief saisi

**Profil de marque**

| Champ | Valeur |
|---|---|
| Entreprise | Maison Kola |
| Secteur | Torréfaction artisanale, boutique et vente en ligne |
| Audience | 25-40 ans, urbains de Douala, sensibles au made in local |
| Ton | Direct, chaleureux, un peu d'autodérision |
| Interdits | Ne jamais citer un concurrent, aucune promesse de délai de livraison |

**Publications existantes fournies** — c'est ce qui donne sa voix à l'agent :

> On a torréfié 40 kg ce matin. L'atelier sent le caramel et personne ne s'en plaint.
>
> Rappel : la boutique ferme à 18h vendredi, on part tous au marché de Bonanjo.

**Mission**

- Sujet : ouverture de la deuxième boutique à Douala, quartier Akwa, le 15 septembre
- Objectif : engagement
- Précisions : -20% sur tout le jour de l'ouverture, dégustation gratuite de 9h à 12h

## L'angle éditorial retenu

> Au lieu d'une annonce solennelle, on prend l'angle des coulisses de l'installation à
> Akwa pour créer de la proximité et lancer la discussion sur les habitudes de café
> dans le quartier.

Cet angle est arrêté par un premier appel court, puis chaque réseau le décline avec
ses propres mots — la consigne interdit d'en recopier les tournures.

## Le post — X (Twitter), 244 / 280 caractères

**Accroche**

> Installer des machines à café à Akwa entre deux coups de peinture, c'est du sport.

**Accroches alternatives proposées**

1. Akwa, vous buvez votre café serré le matin ou plutôt rallongé ?
2. On emménage à Akwa et nos cartons de tasses occupent déjà le comptoir.

**Corps du post**

> Maison Kola ouvre sa 2e boutique le 15 septembre à Akwa [adresse précise à confirmer].
> Au programme : dégustation gratuite de 9h à 12h et -20% toute la journée.

**Appel à l'action**

> C'est quoi votre spot café dans le quartier ?

**Hashtags** — `#douala` `#akwa`

**Brief visuel**

> Photo prise au smartphone : un membre de l'équipe assis sur un carton de déménagement
> dans le local d'Akwa en travaux, un paquet de café à la main.

## Ce que cet exemple démontre

**La voix de marque est imitée, pas devinée.** « Installer des machines à café entre deux
coups de peinture, c'est du sport » reprend le registre des deux publications fournies :
concret, un peu ironique, sans emphase. Sans le champ « publications existantes », l'agent
n'aurait eu que l'adjectif « chaleureux » à se mettre sous la dent.

**Rien n'est inventé.** L'adresse exacte n'était pas dans le brief : elle sort en
`[adresse précise à confirmer]` au lieu d'être fabriquée. La date, l'horaire et la remise,
eux, viennent bien du brief.

**La contrainte de longueur est tenue par le code, pas par le modèle.** Le premier jet
faisait 335 caractères pour une limite de 280. Le contrôle automatique l'a mesuré, a
déclenché une passe de réparation en nommant le dépassement, et le résultat publié tient
en 244 caractères. Un LLM compte mal les caractères ; ici il n'a pas eu à le faire.

Trace serveur de cette génération :

```
[cm/generate] brief 29.8s
[cm/generate] x 24.1s puis reparation : Le post fait 335 caractères alors que
              X (Twitter) en autorise 280. Raccourcis de 55 caractères au minimum.
[cm/generate] x reparation terminee en 38.7s au total, 0 defaut(s) restant(s)
[cm/generate] campagne complete en 68.5s
```

## Reproduire

```bash
npm run dev          # puis remplir le formulaire sur http://localhost:3000
npm run test:agent   # ou lancer les 51 controles automatiques sur les deux routes
```
