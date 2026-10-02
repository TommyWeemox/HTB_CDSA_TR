---
tags: [cdsa, splunk]
---

# Splunk : sources de logs & investigation

## Objectif

Investiguer avec SPL, comprendre les sources de logs et détecter des attaques Windows.

## Concepts

- Index, sourcetype, champs extraits, `tstats` pour la performance.
- Workflow : identifier les sources → filtrer → agréger → pivoter.
- Voir [cheatsheet SPL](../cheatsheets/splunk-spl.md).

## Requêtes

```spl
index=main sourcetype="WinEventLog:Security" EventCode=4625
| stats count by Account_Name, src_ip
| where count > 10
```

## Mapping ATT&CK

| Technique | Requête |
|---|---|
| T1110 Brute force | 4625 agrégé par source |

## Lab

- [ ] Ingérer des logs d'exemple (BOTS ou lab perso)
- [ ] Sauvegarder 5 recherches comme alertes

## À retenir

- Commence large, **réduis tôt** (index, sourcetype, temps).
