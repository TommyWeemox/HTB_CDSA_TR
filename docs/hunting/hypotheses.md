---
tags: [hunting, attack]
---

# Playbook d'hypothèses

| Tactique | Hypothèse | Technique | Données |
|---|---|---|---|
| Execution | Office lance cmd/PowerShell | T1204.002 | Sysmon 1 |
| Execution | PowerShell encodé | T1059.001 | 4104, Sysmon 1 |
| Persistence | Nouvelle tâche planifiée / service | T1053.005, T1543.003 | 4698, 7045 |
| Persistence | Clés Run modifiées | T1547.001 | Sysmon 13 |
| Priv. Esc. | Token/UAC bypass | T1548.002 | Sysmon 1 |
| Defense Evasion | Effacement des journaux | T1070.001 | 1102, 104 |
| Cred. Access | Accès à LSASS | T1003.001 | Sysmon 10 |
| Cred. Access | Kerberoasting | T1558.003 | 4769 |
| Discovery | Rafale de commandes `net`, `whoami` | T1087, T1033 | Sysmon 1 |
| Lateral Mvmt | PsExec / services distants | T1021.002, T1569.002 | 7045, 5145 |
| C2 | Beaconing régulier | T1071 | Zeek conn, proxy |
| Exfiltration | Gros upload vers cloud inconnu | T1567 | Proxy, NetFlow |
