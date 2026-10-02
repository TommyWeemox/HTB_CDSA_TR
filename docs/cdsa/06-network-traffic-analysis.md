---
tags: [cdsa, network]
---

# Network Traffic Analysis

## Objectif

Analyser des captures pour repérer reconnaissance, C2, exfiltration, mouvement latéral.

## Concepts

- Wireshark (filtres d'affichage), tshark, Zeek (`conn.log`, `dns.log`, `http.log`, `ssl.log`).
- Indices : beaconing (intervalle régulier), DNS tunneling, gros transferts sortants, ports atypiques.
- Voir [cheatsheet réseau](../cheatsheets/network.md).

## Requêtes

```
http.request.method == "POST" && ip.dst != 10.0.0.0/8
dns.qry.name.len > 50
```

## Mapping ATT&CK

| Technique | Indice |
|---|---|
| T1071.004 DNS | Requêtes longues, haute entropie |
| T1041 Exfil C2 | Gros volume sortant |

## Lab

- [ ] Analyser un pcap de malware-traffic-analysis.net
- [ ] Extraire les IOC et les documenter

## À retenir

- Le trafic chiffré se détecte par **métadonnées** (JA3, SNI, timing, volume).
