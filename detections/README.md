# Detections

Règles versionnées (Detection-as-Code).

```
detections/
  sigma/   règles Sigma (.yml), nommées <category>_<os>_<description>.yml
  spl/     requêtes Splunk
  kql/     requêtes Elastic / Sentinel
```

Chaque règle porte son tag ATT&CK, ses faux positifs connus et son résultat de test.
Voir `docs/detection-engineering/`.
