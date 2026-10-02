---
tags: [cdsa, incident-response]
---

# Incident Handling

## Objectif

Appliquer un cycle de réponse à incident et produire un rapport exploitable.

## Cycle (NIST SP 800-61)

```mermaid
flowchart LR
    P[Préparation] --> D[Détection & analyse] --> C[Confinement, éradication, reprise] --> L[Retour d'expérience]
    L --> P
```

## Concepts

- Triage : sévérité, périmètre, impact, priorité.
- Confinement : isolation hôte, désactivation de compte, blocage IOC.
- Éradication puis reprise, **après** compréhension de la persistance.
- Rapport : résumé exécutif, timeline, IOC, techniques ATT&CK, recommandations.

## Lab

- [ ] Rédiger un rapport complet à partir d'un lab ([template](../resources/templates.md))

## À retenir

- Documenter **chaque action avec l'heure** pendant l'incident.
