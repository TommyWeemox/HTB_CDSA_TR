---
tags: [cdsa, elastic, kibana, kql]
---

# 7. Elastic & Kibana pas à pas

Le domaine officiel **SIEM Operations (ELK/Splunk)** est évalué en pratique : il faut savoir **manipuler l'outil**. Ce chapitre se concentre sur Elastic ; la partie Splunk est dans le [module 4](../04-splunk.md).

!!! warning "Noms de champs"
    Les champs exacts dépendent de ton collecteur (Winlogbeat, Elastic Agent) et de la version. Les exemples utilisent les noms **ECS** courants. **Vérifie toujours dans Discover** les champs réellement présents avant d'écrire une requête.

## 1. Discover : explorer les données

Discover est ton point de départ pour **toute** investigation.

1. Choisis la **vue de données** (data view), par exemple `winlogbeat-*` ou `logs-*`. Si rien n'apparaît : mauvais index ou **plage de temps trop étroite**.
2. Règle la **plage de temps** (en haut à droite). C'est la cause n°1 de « mes données ont disparu ».
3. Tape ta requête **KQL** dans la barre.
4. Utilise la **liste des champs** à gauche : clique sur un champ pour voir ses valeurs les plus fréquentes, puis sur **+** pour filtrer, **−** pour exclure, ou ajoute-le en **colonne**.
5. Enregistre la recherche pour la retrouver.

!!! note "Le panneau de champs est un échantillon"
    Les « valeurs principales » sont calculées sur un **échantillon** de documents (de l'ordre de 500), pas sur tout le résultat. Pour un comptage fiable, utilise une **visualisation** ou une agrégation.

!!! warning "Fuseau horaire"
    Kibana affiche par défaut l'heure dans le fuseau de **ton navigateur**, alors que les données sont stockées en UTC. Quand tu notes une chronologie, **précise toujours UTC**.

## 2. KQL : la syntaxe à maîtriser

| Besoin | Syntaxe |
|---|---|
| Égalité | `event.code : "4625"` |
| Plusieurs valeurs | `event.code : ("4624" or "4625")` |
| ET / OU / NON | `a and b`, `a or b`, `not a` |
| Groupement | `(a or b) and c` |
| Champ présent | `source.ip : *` |
| Comparaison | `process.pid > 1000` |
| Joker | `process.command_line : *-enc*` |
| Phrase | `message : "Failed password"` |

### Les pièges classiques

!!! danger "1. Les jokers ne marchent pas entre guillemets"
    `process.name : "power*"` cherche littéralement le texte `power*`. Il faut écrire `process.name : power*` **sans guillemets**.

!!! danger "2. Les antislash doivent être échappés"
    Pour un chemin Windows : `process.executable : "C:\\Windows\\System32\\cmd.exe"` (double `\\`).

!!! danger "3. Attention à la casse"
    Sur les champs de type **keyword** (la plupart des champs ECS), la correspondance est **sensible à la casse** : `PowerShell.exe` ≠ `powershell.exe`, alors que Windows ne fait pas la différence. Teste les variantes ou utilise EQL (voir plus bas).

!!! danger "4. `text` vs `keyword`"
    Un champ **text** est analysé (découpé en mots) : bon pour la recherche libre. Un champ **keyword** est exact : bon pour filtrer et agréger. Si une requête « devrait marcher » mais ne renvoie rien, vérifie le **type du champ**.

### Requêtes d'analyse

```
# Échecs de connexion
event.code : "4625"

# Échecs de connexion d'une source précise
event.code : "4625" and source.ip : "203.0.113.45"

# Connexions RDP réussies
event.code : "4624" and winlog.event_data.LogonType : "10"

# Office qui lance un interpréteur (Sysmon 1)
event.code : "1" and process.parent.name : ("winword.exe" or "excel.exe")
  and process.name : ("cmd.exe" or "powershell.exe")

# PowerShell avec commande encodée
process.name : "powershell.exe" and process.command_line : (*-enc* or *-EncodedCommand*)
```

!!! tip "Performance"
    Un joker **en début** de valeur (`*-enc*`) est coûteux sur de gros volumes. Restreins d'abord par **champ précis et plage de temps**, puis affine.

## 3. EQL : les séquences

KQL ne sait pas exprimer « A **puis** B ». EQL, si. Exemple : « 10 échecs puis un succès pour la même source en 10 minutes » :

```eql
sequence by source.ip with maxspan=10m
  [authentication where event.code == "4625"] with runs=10
  [authentication where event.code == "4624"]
```

- `sequence by source.ip` : les événements doivent partager la **même IP source** ;
- `maxspan=10m` : la séquence doit tenir dans 10 minutes ;
- `with runs=10` : l'étape se répète 10 fois.

Autre exemple, Office puis interpréteur (utile pour du hunting) :

```eql
process where process.parent.name == "winword.exe" and process.name in ("cmd.exe", "powershell.exe")
```

!!! note "Casse en EQL"
    `==` est sensible à la casse. L'opérateur `:` permet une comparaison **insensible à la casse** (avec jokers possibles) dans les versions récentes. Consulte la documentation de ta version.

## 4. Créer une règle de détection (Kibana Security)

*Security → Rules → Detection rules (SIEM) → Create new rule*.

| Type de règle | Usage |
|---|---|
| **Custom query** | Une requête KQL qui déclenche à chaque correspondance |
| **Threshold** | « N événements regroupés par champ en X minutes » |
| **Event correlation** | Séquences **EQL** |
| **Indicator match** | Correspondance avec des IOC d'une source de CTI |
| **New terms** | Détecte une valeur **jamais vue** (nouveau processus sur un hôte…) |
| **Machine learning** | Anomalies statistiques |

### Étapes (exemple : password spraying, type Threshold)

1. **Index patterns** : les index qui contiennent tes logs d'authentification.
2. **Requête** : `event.code : "4625"`.
3. **Group by** : `source.ip`, **seuil** : 20.
4. **Planification** : `Runs every` (fréquence d'exécution) et **`Additional look-back time`** (marge de recouvrement).
5. **Sévérité et score de risque**, **mapping MITRE ATT&CK** (T1110).
6. **Actions** (notification, ticket) et **exceptions** documentées.

!!! tip "Pourquoi `Additional look-back time` ?"
    Les événements **arrivent avec du retard** (délai d'ingestion, voir [chapitre 2](02-architecture.md)). Sans marge, une règle qui s'exécute toutes les 5 minutes sur « les 5 dernières minutes » **rate les événements tardifs**. Prévois une marge supérieure au retard d'ingestion typique.

## 5. Ce qu'un analyste fait ensuite : l'alerte → l'investigation

1. Ouvre l'alerte, lis **le contexte et le mapping ATT&CK**.
2. Depuis les champs de l'alerte (IP, utilisateur, hôte), **pivote dans Discover** sur la même plage de temps.
3. Reconstitue la chronologie, **enrichis** puis **documente**.

## Erreurs fréquentes

- Plage de temps trop courte ou mauvaise vue de données.
- Joker mis entre guillemets, antislash non échappé.
- Casse ignorée sur les champs `keyword`.
- Règle planifiée sans marge de rattrapage.
- Écrire une requête sans avoir vérifié les noms de champs réels.

## À retenir

- **Discover → KQL → pivot** : le cycle de base de l'analyste Elastic.
- Quatre pièges KQL : jokers, antislash, casse, type de champ.
- EQL pour les **séquences** ; Threshold pour les **comptages**.
- Une règle sans **look-back** rate les événements en retard.
