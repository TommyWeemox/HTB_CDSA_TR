---
tags: [cdsa, windows, sysmon]
---

# Windows Event Logs & Finding Evil

## Objectif

Lire et exploiter les journaux Windows et Sysmon pour repérer l'activité malveillante.

## Concepts

- Journaux clés : `Security`, `System`, `Application`, `Microsoft-Windows-Sysmon/Operational`, `PowerShell/Operational`.
- **ETW** : traçage noyau/utilisateur, base de nombreux EDR.
- **Sysmon** : création de processus (1), connexions réseau (3), chargement d'image (7), accès processus (10), création de fichier (11), registre (12-14), pipes (17-18), WMI (19-21), DNS (22).
- Voir [Event IDs Windows](../cheatsheets/windows-event-ids.md) et [Sysmon](../cheatsheets/sysmon.md).

## Requêtes

```powershell
# Derniers échecs de connexion
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 50

# Créations de processus Sysmon avec ligne de commande
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Select-Object TimeCreated, @{n='Cmd';e={$_.Properties[10].Value}}
```

## Mapping ATT&CK

| Technique | Event |
|---|---|
| T1059.001 PowerShell | 4104, Sysmon 1 |
| T1003.001 LSASS | Sysmon 10 (TargetImage lsass.exe) |
| T1053.005 Tâche planifiée | 4698 |

## Lab

- [ ] Installer Sysmon avec une config communautaire
- [ ] Simuler T1003.001 et retrouver l'événement

## À retenir

- Toujours corréler **processus parent → enfant → ligne de commande → réseau**.
