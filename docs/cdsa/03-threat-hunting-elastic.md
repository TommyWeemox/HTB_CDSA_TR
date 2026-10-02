---
tags: [cdsa, hunting, elastic]
---

# Threat Hunting avec Elastic

## Objectif

Mener un hunt structuré : hypothèse → données → requêtes → conclusion, dans la stack Elastic.

## Concepts

- Hunting **piloté par hypothèse** vs par IOC vs par anomalie. Voir [méthodologie](../hunting/methodology.md).
- Stack : Beats/Elastic Agent → Elasticsearch → Kibana (Discover, Lens, Timeline).
- Langages : **KQL** (filtre), **EQL** (séquences), ES|QL.

## Requêtes

```
process.name : "powershell.exe" and process.args : ("-enc" or "-EncodedCommand")
```

```eql
sequence by host.id with maxspan=1m
  [process where process.name == "winword.exe"]
  [process where process.parent.name == "winword.exe" and process.name in ("cmd.exe","powershell.exe")]
```

## Mapping ATT&CK

| Technique | Hypothèse |
|---|---|
| T1204.002 | Office lance un interpréteur |

## Lab

- [ ] Déployer Elastic (voir [home lab](../labs/home-lab.md))
- [ ] Documenter un hunt dans `hunts/`

## À retenir

- Un hunt sans résultat est un **résultat** : documente la couverture.
