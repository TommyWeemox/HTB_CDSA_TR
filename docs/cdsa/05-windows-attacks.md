---
tags: [cdsa, active-directory, windows]
---

# Attaques Windows & défense

## Objectif

Connaître les attaques AD courantes et leurs traces défensives.

## Concepts

| Attaque | Technique | Traces |
|---|---|---|
| Kerberoasting | T1558.003 | 4769 avec chiffrement RC4 (0x17) |
| AS-REP Roasting | T1558.004 | 4768 sans pré-auth |
| Pass-the-Hash | T1550.002 | 4624 type 3, NTLM |
| DCSync | T1003.006 | 4662 avec GUID de réplication |
| Golden Ticket | T1558.001 | Anomalies 4768/4769 |
| Mouvement latéral | T1021.* | 4624 type 3/10, 7045 |

## Requêtes

```spl
index=main EventCode=4769 Ticket_Encryption_Type=0x17 Service_Name!="*$"
| stats count by Account_Name, Service_Name
```

## Lab

- [ ] Reproduire Kerberoasting dans le lab et retrouver 4769
- [ ] Rédiger la règle Sigma associée

## À retenir

- Beaucoup d'attaques AD sont détectables par **volume** et **rareté** (qui demande quoi, à quelle fréquence).
