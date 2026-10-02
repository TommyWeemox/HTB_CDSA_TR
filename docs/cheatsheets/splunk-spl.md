# Splunk SPL

```spl
index=main sourcetype=X earliest=-24h
| search field="value"
| stats count by host, user
| sort - count
| head 20
```

| Besoin | Commande |
|---|---|
| Compter | `stats count by f` |
| Valeurs distinctes | `stats dc(f)`, `values(f)` |
| Rare | `rare f` |
| Série temporelle | `timechart span=1h count by f` |
| Nouveau champ | `eval x=if(a>5,"high","low")` |
| Regex | `rex field=_raw "user=(?<u>\w+)"` |
| Jointure | `join type=left key [ search ... ]` |
| Rapide | `tstats count where index=main by _time span=1h` |
| Transaction | `transaction user maxspan=10m` |
| Lookup | `lookup table.csv key OUTPUT val` |

## Patterns

```spl
| stats count by src_ip | where count > 50       ``` brute force ```
| streamstats count as n by user | where n=1     ``` première occurrence ```
```
