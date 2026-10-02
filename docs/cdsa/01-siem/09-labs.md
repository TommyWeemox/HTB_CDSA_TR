---
tags: [cdsa, labs, siem]
---

# 9. Labs

Six exercices progressifs. Chacun produit un **livrable** à versionner dans le dépôt. Coche-les dans le [suivi de progression](../../study-plan/progress.md) une fois terminés.

!!! danger "Environnement"
    Tout se fait dans ton [home lab isolé](../../labs/home-lab.md), jamais sur un poste ou réseau de production.

## Lab 1 : Matrice sources → détections *(papier, 45 min)*

**Objectif** : apprendre à raisonner « technique → donnée ».

1. Prends 8 techniques : T1110, T1059.001, T1053.005, T1003.001, T1021.001, T1070.001, T1136.001, T1558.003.
2. Pour chacune, remplis : **source de logs**, **événement précis** (ID), **audit à activer**, **champ clé**.
3. Repère les sources qu'il te faut collecter en priorité (celles qui couvrent le plus de techniques).

**Livrable** : `docs/labs/matrice-sources.md` (tableau).
**Vérification** : chaque ligne nomme un identifiant d'événement concret, pas seulement « les logs Windows ».

## Lab 2 : Brancher des logs Windows à un SIEM *(2 h)*

**Objectif** : monter le pipeline complet et **prouver** qu'il fonctionne.

1. Installe Splunk (version d'évaluation/gratuite) **ou** Elastic dans une VM.
2. Sur une VM Windows, installe l'agent :
    - **Splunk** : Universal Forwarder avec, dans `inputs.conf` :
      ```ini
      [WinEventLog://Security]
      index = wineventlog
      disabled = 0
      ```
    - **Elastic** : Elastic Agent avec l'intégration *Windows*.
3. Génère des événements : échec de connexion volontaire (mauvais mot de passe en RDP/console), ouverture d'un `cmd`.
4. Vérifie la réception dans le SIEM.

**Livrable** : captures d'écran + les 3 requêtes de vérification (volume par heure, par `EventCode`, derniers événements).
**Vérification** : tu retrouves ton échec de connexion (**4625**) avec le bon horodatage UTC et le bon hôte.

??? tip "Si rien n'arrive"
    Vérifie dans l'ordre : service de l'agent démarré → réseau/port ouvert → index existant (Splunk) → droits de lecture du journal Security → erreurs dans les logs de l'agent.

## Lab 3 : Trois use cases complets *(2 h)*

**Objectif** : écrire des use cases selon le [tableau d'anatomie](03-use-cases.md#anatomie-dun-use-case).

| Use case | Événements | Simulation dans le lab |
|---|---|---|
| Brute force / spraying | 4625, 4624 | Boucle de mauvais mots de passe sur le lab |
| Nouveau compte local + ajout au groupe Administrateurs | 4720, 4732 | `net user labtest <mdp> /add` puis `net localgroup Administrators labtest /add` |
| Effacement du journal de sécurité | 1102 | `wevtutil cl Security` |

Pour chacun : requête, seuil/condition, sévérité, faux positifs attendus, runbook court.

**Livrable** : 3 règles dans `detections/spl/` (ou `kql/`) et un fichier Sigma pour au moins une.
**Vérification** : chaque règle se déclenche **sur ta simulation** et reste silencieuse sur l'activité normale.

!!! note "Audit"
    Ces événements dépendent de la **politique d'audit** (gestion des comptes, gestion des groupes). Si rien ne remonte, vérifie-la avec `auditpol /get /category:*`.

## Lab 4 : Détecter une source silencieuse *(1 h)*

**Objectif** : surveiller la santé de ta collecte.

1. Reprends la requête du [chapitre 2](02-architecture.md#6-la-qualite-des-donnees-le-sujet-quon-oublie).
2. Transforme-la en **alerte planifiée** (toutes les 15 min).
3. **Arrête l'agent** sur ta VM Windows et vérifie que l'alerte se déclenche.
4. Redémarre l'agent et confirme le retour à la normale.

**Livrable** : la règle + une note de 5 lignes sur le seuil choisi et pourquoi.

## Lab 5 : Triage complet d'une intrusion simulée *(2 h)*

**Objectif** : rejouer le [cas pratique](04-triage.md#cas-pratique-4625-en-rafale) de bout en bout.

1. Depuis la VM d'attaque, lance un **spraying contre la VM Windows** (quelques comptes de test, 1 ou 2 essais chacun), puis une connexion réussie.
2. Dans le SIEM, **sans regarder ce que tu as lancé**, joue l'analyste : qualifie, pivote, détermine le périmètre.
3. Rédige la **note de clôture** avec chronologie UTC et recommandations.

**Livrable** : `hunts/AAAA-MM-JJ_spraying-rdp.md` (depuis `hunts/TEMPLATE.md`) + note de clôture.
**Vérification** : ta chronologie correspond à ce que tu as réellement fait côté attaquant.

## Lab 6 : Règles Kibana et séquence EQL *(2 h)*

**Objectif** : passer de la requête à la **règle de détection** dans Elastic (voir [chapitre 7](07-elastic-kibana.md)).

1. Dans Discover, écris les 4 requêtes KQL du chapitre 7 et **corrige les noms de champs** selon tes données réelles.
2. Crée une règle **Threshold** (≥ 20 échecs 4625 par `source.ip` en 5 min) avec le mapping ATT&CK T1110.
3. Crée une règle **EQL** « 10 échecs puis un succès » sur la même source.
4. Déclenche-les depuis ta VM d'attaque et vérifie les alertes. Règle ensuite `Additional look-back time` et explique pourquoi.

**Livrable** : export des deux règles (JSON/NDJSON) dans `detections/kql/` + 5 lignes sur les pièges rencontrés.
**Vérification** : les deux règles se déclenchent sur ta simulation et **pas** sur une connexion normale.

## Défi final

Cartographie les règles que tu as écrites sur **ATT&CK Navigator** et liste, pour ton lab, les **5 techniques prioritaires non couvertes** avec la source de logs qu'il te manque.
