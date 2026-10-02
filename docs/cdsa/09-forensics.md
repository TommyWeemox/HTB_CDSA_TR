---
tags: [cdsa, forensics]
---

# Digital Forensics

## Objectif

Collecter et analyser des artefacts disque et mémoire, construire une timeline.

## Concepts

- Ordre de volatilité : mémoire → réseau → processus → disque.
- Artefacts Windows : Prefetch, Amcache, ShimCache, UserAssist, MFT, USN, registre, LNK, JumpLists.
- Mémoire : Volatility 3 (`windows.pslist`, `windows.netscan`, `windows.malfind`).
- Chaîne de custody et intégrité (hash).

## Lab

- [ ] Analyser un dump mémoire avec Volatility 3
- [ ] Construire une super-timeline (Plaso)

## À retenir

- Corréler plusieurs artefacts : un seul n'est jamais une preuve.
