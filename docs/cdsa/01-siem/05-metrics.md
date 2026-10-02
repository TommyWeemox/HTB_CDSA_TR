---
tags: [cdsa, metrics, soc]
---

# 5. Métriques & maturité

Ce qui n'est pas mesuré ne s'améliore pas, mais **une métrique mal choisie dégrade ce qu'elle prétend améliorer**.

## Les métriques de temps

| Métrique | Définition | Remarque |
|---|---|---|
| **MTTD** (Mean Time To Detect) | Délai entre le **début** de l'activité malveillante et sa **détection** | Reflète la qualité de la détection ; le début réel n'est connu qu'après enquête |
| **MTTA** (… To Acknowledge) | Délai entre l'**alerte** et sa **prise en charge** | Reflète la capacité de la file d'attente |
| **MTTR** (… To Respond/Resolve) | Délai entre la **détection** et la **réponse** ou résolution | La définition varie : fixe-la par écrit |
| **MTTC** (… To Contain) | Délai jusqu'au **confinement** | Souvent plus parlant que le MTTR |

!!! warning "Définis chaque terme"
    « MTTR » désigne selon les organisations *respond*, *resolve*, *recover* ou *repair*. Écris ta définition, sinon deux équipes comparent des choses différentes.

## Les métriques de qualité

| Métrique | Calcul | Ce qu'elle dit |
|---|---|---|
| **Précision** d'une règle | vrais positifs / alertes totales | Combien d'alertes valent le coup |
| **Taux de faux positifs** | faux positifs / alertes totales | Le bruit généré |
| **Volume par analyste** | alertes traitées / analyste / période | La charge, le risque de fatigue |
| **Taux d'escalade** | alertes escaladées / alertes triées | La pertinence du tri |
| **Couverture ATT&CK** | techniques pertinentes détectées / techniques pertinentes | Les angles morts (voir plus bas) |
| **Couverture des sources** | sources critiques collectées / sources critiques attendues | La visibilité réelle |

## Couverture : ce qu'elle veut dire

Une technique est **couverte** quand **deux conditions** sont réunies :

1. **Visibilité** : les données nécessaires sont collectées et exploitables.
2. **Détection** : une règle **testée et fonctionnelle** existe.

!!! danger "Avoir des logs n'est pas avoir une détection"
    Une règle jamais testée compte pour de la couverture sur le papier mais pas dans la réalité. Valide en **simulant la technique** (voir [tests](../../detection-engineering/testing.md)).

Visualise la couverture avec ATT&CK Navigator : une couche pour ce que tu détectes, une pour les techniques utilisées par les groupes pertinents. **L'écart entre les deux est ta liste de priorités.**

## Le piège des métriques (loi de Goodhart)

> Quand une mesure devient un objectif, elle cesse d'être une bonne mesure.

| Métrique visée | Comportement dégradé |
|---|---|
| MTTR le plus bas possible | On ferme vite sans investiguer |
| Nombre d'alertes traitées | On traite les faciles, on évite les complexes |
| Zéro faux positif | On affaiblit les règles, des attaques passent |

Parade : **croiser les métriques** (vitesse **et** qualité), compléter par des **revues de cas** et des **exercices** (purple teaming).

## Maturité

```mermaid
flowchart LR
    A["Réactif : on traite les alertes"] --> B["Structuré : use cases, runbooks, métriques"]
    B --> C["Proactif : hunting régulier, couverture ATT&CK"]
    C --> D["Optimisé : detection-as-code, automatisation, purple team"]
```

Des référentiels existent pour s'évaluer (par exemple le **SOC-CMM**) : utilise-les comme grille d'auto-évaluation, pas comme score à afficher.

## Pour vérifier

??? question "Un SOC divise son MTTR par deux en un trimestre. Est-ce forcément bon ?"
    Non. Il faut vérifier que la **qualité** n'a pas baissé (clôtures trop rapides, investigations bâclées, faux négatifs). Une métrique de vitesse doit toujours être lue avec une métrique de qualité.

??? question "Quand une technique ATT&CK est-elle réellement « couverte » ?"
    Quand la **visibilité** (données collectées) **et** une **détection testée** existent.

## À retenir

- Définis **par écrit** MTTD / MTTR avant de les comparer.
- **Visibilité + règle testée** = couverture ; sinon c'est un angle mort.
- Croise vitesse et qualité pour éviter l'effet Goodhart.
- Les métriques servent à **décider des améliorations**, pas à se rassurer.
