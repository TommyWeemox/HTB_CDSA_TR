---
tags: [cdsa, siem, soc]
---

# Module 1 : SOC, SIEM & Monitoring

Ce module pose les bases sur lesquelles reposent tous les autres : **comment un SOC est organisé, comment un SIEM transforme des logs bruts en alertes, et comment on traite une alerte de bout en bout.**

## Objectifs

À la fin du module, tu sais :

- [x] expliquer le rôle d'un SOC, ses niveaux et ses outils ;
- [x] décrire le pipeline d'un SIEM (collecte → parsing → stockage → corrélation → alerte) et ses points de défaillance ;
- [x] concevoir un use case de détection complet (menace, données, logique, sévérité, runbook) ;
- [x] trier une alerte avec méthode : qualifier, enrichir, pivoter, escalader, documenter ;
- [x] mesurer l'efficacité d'un SOC sans tomber dans les pièges des métriques.

## Plan

| Chapitre | Contenu | Durée indicative |
|---|---|---|
| [1. Le SOC](01-soc.md) | Mission, rôles, processus, outils, modèles de référence | 1 h |
| [2. Architecture d'un SIEM](02-architecture.md) | Sources, collecte, normalisation, stockage, qualité des données | 1 h 30 |
| [3. Use cases & détection](03-use-cases.md) | Types de logique, brute force, tuning, sévérité, runbooks | 1 h 30 |
| [4. Triage & investigation](04-triage.md) | Workflow, enrichissement, pivots, biais, cas pratique | 1 h 30 |
| [5. Métriques & maturité](05-metrics.md) | MTTD/MTTR, couverture, pièges | 45 min |
| [6. Labs](06-labs.md) | 5 exercices concrets avec livrables | 4 à 6 h |
| [7. Quiz](07-quiz.md) | 31 questions avec explications | 30 min |

## Comment étudier ce module

1. Lis un chapitre **avec ton SIEM de lab ouvert** et rejoue chaque requête.
2. Réponds de mémoire aux encadrés « Pour vérifier » avant de lire la suite.
3. Fais les labs : ils produisent des fichiers à committer dans `detections/` et `hunts/`.
4. Passe le quiz, relis les thèmes faibles, refais les erreurs.

!!! info "Lien avec la certification"
    Le parcours HTB SOC Analyst introduit la surveillance et le SIEM via la stack Elastic. Les notions de ce module (pipeline, use cases, triage) sont indépendantes de l'outil : elles s'appliquent aussi à Splunk, Sentinel ou QRadar. Vérifie le syllabus officiel pour le détail exact des modules.
