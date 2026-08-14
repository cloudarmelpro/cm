-- État de la base, pour vérifier un parcours de bout en bout.
--   docker cp scripts/db-state.sql cm-postgres:/tmp/state.sql
--   docker exec cm-postgres psql -U cm -d cm -f /tmp/state.sql
--
-- Passer par un fichier n'est pas un caprice : « user » est un mot réservé
-- SQL, et le double échappement PowerShell + Docker le casse une fois sur deux.
\echo == comptes ==
select email, email_verified, role from "user";
\echo == organisations ==
select o.name, o.slug, m.role from organization o join member m on m.organization_id = o.id;
\echo == marques ==
select b.name, b.sector, o.name as organisation from brand b join organization o on o.id = b.organization_id;
\echo == campagnes ==
select c.topic, c.goal, count(p.id) as posts
from campaign c left join post p on p.campaign_id = c.id
group by c.id, c.topic, c.goal;
\echo == consommation du mois ==
select kind, count(*), sum(credits) as credits from usage group by kind;
