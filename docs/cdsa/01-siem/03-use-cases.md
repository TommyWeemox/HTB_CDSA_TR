---
tags: [cdsa, detection, use-cases]
---

# 3. Use cases & détection

Un **use case** est un scénario de menace transformé en détection exploitable. Ce n'est pas « une requête » : c'est une requête **plus** son contexte, sa sévérité et sa procédure de traitement.

## Anatomie d'un use case

| Champ | Question à laquelle il répond | Exemple (brute force) |
|---|---|---|
| **Objectif / menace** | Quel comportement veut-on voir ? | Un attaquant devine un mot de passe |
| **ATT&CK** | Quelle technique ? | T1110 Brute Force |
| **Sources de logs** | Quelles données ? | Événements 4625/4624 des DC et serveurs |
| **Logique** | Quelle condition ? | ≥ 20 échecs depuis une même IP en 5 min |
| **Sévérité** | Quelle gravité, quelle priorité ? | Moyenne ; haute si suivi d'un succès |
| **Faux positifs connus** | Qu'est-ce qui déclenche à tort ? | Compte de service au mot de passe expiré |
| **Runbook** | Que fait l'analyste ? | Étapes de triage et d'escalade |
| **Propriétaire / revue** | Qui maintient, quand revoit-on ? | Détection engineer, tous les 6 mois |

## Les types de logique de détection

| Type | Principe | Exemple | Atout | Limite |
|---|---|---|---|---|
| **Signature / IOC** | Correspondance avec une valeur connue | IP/domaine/hash dans une liste de menaces | Simple, précis | Périmé vite, trivial à contourner |
| **Seuil** | Compter dans une fenêtre de temps | 20 échecs de connexion en 5 min | Simple à comprendre | Seuil difficile à calibrer |
| **Corrélation / séquence** | Enchaîner plusieurs événements | Échecs répétés **puis** succès pour le même compte | Réduit les faux positifs | Plus complexe, sensible au temps |
| **Rareté / statistique** | Écart à une base de référence | Processus jamais vu sur ce serveur | Trouve l'inconnu | Demande une baseline, bruité |
| **Comportemental / UEBA** | Modèle d'activité d'un utilisateur ou hôte | Connexion depuis un pays inhabituel | Détecte les abus de comptes légitimes | Complexe, difficile à expliquer |

!!! tip "Combiner réduit le bruit"
    Les meilleures détections combinent un **comportement suspect** et un **contexte** (hôte critique, compte privilégié, heure inhabituelle). Une alerte « un échec de connexion » est inutile ; « 30 échecs puis un succès depuis une IP externe sur un compte admin » mérite l'attention.

## Cas d'étude : le brute force

### Trois attaques, trois signatures

| Attaque | Principe | Signature dans les logs |
|---|---|---|
| **Brute force** | Beaucoup de mots de passe sur **un** compte | Nombreux échecs, **un** compte, souvent une IP |
| **Password spraying** | **Peu** de mots de passe sur **beaucoup** de comptes | Un échec par compte, **plusieurs** comptes, même source |
| **Credential stuffing** | Couples identifiant/mot de passe issus de fuites | Échecs répartis, sources multiples, comptes variés |

Une règle qui ne compte que « les échecs par compte » **rate le password spraying** : chaque compte n'a qu'un ou deux échecs. D'où l'intérêt de grouper aussi **par source** et de compter les **comptes distincts**.

### Requête Splunk

Adapte les noms de champs (`user`, `src_ip`) à ton environnement :

```spl
index=wineventlog EventCode=4625
| bin _time span=5m
| stats count as failures, dc(user) as distinct_users by _time, src_ip
| where failures >= 20 OR distinct_users >= 10
```

`failures >= 20` repère le brute force ; `distinct_users >= 10` repère le spraying.

### Corrélation « échecs puis succès »

```spl
index=wineventlog (EventCode=4625 OR EventCode=4624)
| eval outcome=if(EventCode=4625, "fail", "success")
| stats count(eval(outcome="fail")) as fails,
        count(eval(outcome="success")) as successes,
        earliest(_time) as first_seen, latest(_time) as last_seen
        by user, src_ip
| where fails >= 10 AND successes >= 1
```

Un succès après de nombreux échecs depuis la même IP indique un **compte probablement compromis** : la sévérité doit monter.

### Côté Elastic

KQL filtre mais n'agrège pas. Dans Kibana Security, crée une **règle à seuil** :

- requête : `event.code : 4625`
- regroupement : `source.ip`
- seuil : 20 événements, fenêtre 5 minutes.

## Sévérité et priorisation

La priorité combine la **gravité de la menace** et la **criticité de l'actif** :

| | Actif peu critique | Actif critique (DC, serveur de fichiers, compte admin) |
|---|---|---|
| **Comportement faible confiance** | Basse | Moyenne |
| **Comportement forte confiance** | Moyenne | **Haute / critique** |

## Le tuning : réduire le bruit sans devenir aveugle

Sources classiques de faux positifs : scanners de vulnérabilités internes, comptes de service, scripts d'administration, supervision.

Bonnes pratiques :

1. **Comprendre** la cause avant d'agir (jamais « désactiver la règle »).
2. Préférer **exclure précisément** (hôte + compte + commande) plutôt que largement.
3. **Documenter** chaque exception : justification, propriétaire, **date de revue**.
4. Ajouter du **contexte** (criticité de l'actif, appartenance à un groupe) plutôt que d'élever des seuils au hasard.
5. **Mesurer** après modification : le volume baisse-t-il sans perdre les vrais positifs ?

!!! danger "Alert fatigue"
    Trop d'alertes à faible valeur épuisent les analystes : les vraies attaques finissent noyées. C'est une cause documentée d'incidents manqués. **Une règle bruyante est un risque de sécurité.**

## Le runbook

Un bon runbook tient sur une page :

1. **Contexte** : ce que détecte la règle, pourquoi c'est important.
2. **Validation** : comment vérifier si c'est réel (requêtes, sources).
3. **Enrichissement** : quoi consulter (inventaire, réputation, historique de l'utilisateur).
4. **Décisions** : critères de faux positif, de vrai positif, d'escalade.
5. **Réponse** : actions autorisées (isoler, réinitialiser un mot de passe) et qui peut les déclencher.

## Pour vérifier

??? question "Pourquoi la détection du password spraying exige-t-elle de grouper par IP source plutôt que par compte ?"
    Parce que chaque compte ne subit que peu d'échecs : le signal se trouve dans le **nombre de comptes distincts visés par une même source**.

??? question "Une règle déclenche 200 fois par jour, presque toujours sur le scanner interne. Que fais-tu ?"
    Exclure précisément l'IP/hôte du scanner (avec justification, propriétaire et date de revue), puis vérifier que les vrais positifs restent détectés. Ne pas désactiver la règle.

## À retenir

- Use case = **menace + données + logique + sévérité + runbook + propriétaire**.
- Combine **comportement** et **contexte** pour limiter les faux positifs.
- Brute force, spraying et stuffing ont **trois signatures différentes**.
- Toute exception de tuning est **documentée et revue**.
- Une règle bruyante dégrade la sécurité.

## Pour aller plus loin

- Rédige les use cases des labs en utilisant le tableau d'anatomie ci-dessus.
- Convertis une règle en Sigma : voir [Sigma](../../detection-engineering/sigma.md).
