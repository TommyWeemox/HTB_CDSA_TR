# Sysmon Event IDs

| ID | Événement | Usage défensif |
|---|---|---|
| 1 | Process Create | Ligne de commande, parent, hash |
| 2 | File creation time changed | Timestomping |
| 3 | Network connection | C2, mouvement latéral |
| 5 | Process terminated | |
| 6 | Driver loaded | Drivers vulnérables |
| 7 | Image loaded | DLL side-loading |
| 8 | CreateRemoteThread | Injection |
| 10 | ProcessAccess | Accès LSASS |
| 11 | FileCreate | Dépôt de charge |
| 12/13/14 | Registry | Persistance |
| 15 | FileCreateStreamHash | ADS |
| 17/18 | Pipe created / connected | C2 (Cobalt Strike) |
| 19/20/21 | WMI | Persistance WMI |
| 22 | DNS query | Domaines suspects |
| 23/26 | File delete | Anti-forensics |

Configs communautaires : SwiftOnSecurity, Olaf Hartong (sysmon-modular).
