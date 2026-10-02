---
tags: [cdsa, network, suricata]
---

# IDS / IPS

## Objectif

Déployer, lire et écrire des règles Suricata/Snort.

## Concepts

- IDS (détecte) vs IPS (bloque, en ligne). Signature vs anomalie.
- Anatomie d'une règle : `action proto src port -> dst port (options)`.

## Exemple de règle

```
alert http any any -> $HOME_NET any (msg:"Test UA suspect"; flow:established,to_server; http.user_agent; content:"BadBot"; sid:1000001; rev:1;)
```

## Lab

- [ ] Installer Suricata, rejouer un pcap (`suricata -r capture.pcap`)
- [ ] Écrire 3 règles et les valider sur du trafic bénin et malveillant

## À retenir

- Teste toujours une règle contre du trafic **légitime** pour mesurer les faux positifs.
