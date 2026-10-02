---
tags: [cdsa, log-analysis, windows]
---

# 6. Lire un log : événements annotés

Savoir ce qu'est un événement 4625 ne sert à rien si tu ne sais pas **lire le log brut**. Ce chapitre décortique des événements réels (adresses et noms fictifs) pour que tu saches **quels champs regarder et ce qu'ils disent**.

## La grille de lecture : 5 questions

Pour **tout** log, cherche dans cet ordre :

| Question | Champ typique |
|---|---|
| **Quand ?** | Horodatage (en UTC !) |
| **Où ?** | Hôte qui a journalisé |
| **Qui ?** | Utilisateur (sujet = qui agit, cible = sur qui) |
| **Quoi ?** | Type d'événement, processus, action, résultat |
| **D'où / vers où ?** | IP, port, hôte source, processus parent |

## 1. Windows 4625 : échec de connexion

Voici l'événement brut (vue XML), annoté.

```xml
<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" />
    <EventID>4625</EventID>                                  <!-- (1) type d'événement -->
    <TimeCreated SystemTime="2026-03-14T09:12:41.123Z" />    <!-- (2) quand, en UTC -->
    <EventRecordID>1048577</EventRecordID>
    <Channel>Security</Channel>
    <Computer>SRV-FILE01.corp.local</Computer>               <!-- (3) où -->
  </System>
  <EventData>
    <Data Name="SubjectUserSid">S-1-0-0</Data>              <!-- (4) sujet : aucun, échec avant authentification -->
    <Data Name="SubjectUserName">-</Data>
    <Data Name="TargetUserName">backup</Data>               <!-- (5) compte visé -->
    <Data Name="TargetDomainName">CORP</Data>
    <Data Name="Status">0xc000006d</Data>                   <!-- (6) échec générique -->
    <Data Name="SubStatus">0xc000006a</Data>                <!-- (7) la raison précise -->
    <Data Name="LogonType">3</Data>                         <!-- (8) type de connexion -->
    <Data Name="AuthenticationPackageName">NTLM</Data>      <!-- (9) protocole -->
    <Data Name="WorkstationName">-</Data>
    <Data Name="IpAddress">203.0.113.45</Data>              <!-- (10) source -->
    <Data Name="IpPort">51234</Data>
  </EventData>
</Event>
```

### Ce qu'il faut retenir de chaque champ

| Champ | Lecture |
|---|---|
| `SubStatus` | **La cause réelle** : `0xC000006A` = compte **existant**, mauvais mot de passe · `0xC0000064` = compte **inexistant** · `0xC0000234` = compte **verrouillé** · `0xC0000072` = compte **désactivé** · `0xC0000071` = mot de passe **expiré** |
| `TargetUserName` | Le compte attaqué (pas `SubjectUserName`, souvent vide ici) |
| `LogonType` | `2` interactif · `3` réseau · `4` batch · `5` service · `7` déverrouillage · `10` bureau à distance (RDP) · `11` identifiants en cache |
| `IpAddress` | La source. Vide ou `-` pour les connexions locales |

!!! tip "Le SubStatus est une mine d'or pour un analyste"
    - Beaucoup de `0xC0000064` (compte inexistant) → l'attaquant **devine des noms d'utilisateur** (énumération).
    - Des `0xC000006A` sur des comptes **valides** → il **connaît** les comptes et devine les mots de passe.
    - Un `0xC0000234` → des échecs répétés ont **verrouillé** le compte : le brute force a eu un effet visible.

!!! warning "Piège : RDP et type de connexion"
    Avec **NLA** (authentification au niveau réseau, activée par défaut), un échec de connexion RDP est journalisé en **type 3**, alors qu'un **succès** est journalisé en **type 10** (ou 7 en cas de reconnexion). Si tu ne cherches que le type 10 pour repérer du brute force RDP, tu ne verras rien.

## 2. Windows 4624 : connexion réussie

Mêmes sections, champs utiles différents :

| Champ | Lecture |
|---|---|
| `TargetUserName` / `TargetDomainName` | Le compte qui vient de se connecter |
| `LogonType` | Comment : `10` = RDP, `3` = réseau (partage, WinRM, PsExec…) |
| `IpAddress` | D'où vient la connexion |
| `TargetLogonId` | **Identifiant de session** : sert à relier cette connexion à tout ce qui suit (4672, 4634, activité…) |
| `ElevatedToken` | Le jeton est-il élevé (privilèges administrateur) ? |
| `LogonProcessName`, `AuthenticationPackageName` | Mécanisme d'authentification (`NtLmSsp`/NTLM, `Kerberos`, `Negotiate`) |

!!! note "Corréler avec 4672"
    Un **4672** (privilèges spéciaux attribués) avec le **même `TargetLogonId`** juste après un 4624 indique une session **administrateur**. C'est un signal de gravité.

## 3. Sysmon événement 1 : création de processus (format ECS)

Dans un SIEM Elastic, le même événement arrive normalisé :

```json
{
  "@timestamp": "2026-03-14T09:18:07.412Z",
  "event":   { "code": "1", "provider": "Microsoft-Windows-Sysmon" },
  "host":    { "name": "SRV-FILE01" },
  "user":    { "name": "backup", "domain": "CORP" },
  "process": {
    "name": "cmd.exe",
    "pid": 4412,
    "executable": "C:\\Windows\\System32\\cmd.exe",
    "command_line": "cmd.exe /c whoami /all",
    "parent": { "name": "explorer.exe", "pid": 3120 }
  }
}
```

Lecture : l'utilisateur `backup` a lancé `cmd.exe` depuis `explorer.exe` pour exécuter `whoami /all`. Pris seul, **bénin** ; mais sur un serveur de fichiers, après un RDP depuis une IP externe, c'est de la **découverte** (T1033).

### Le réflexe « parent → enfant »

La relation **processus parent → enfant** est l'un des meilleurs signaux :

| Parent | Enfant | Pourquoi c'est suspect |
|---|---|---|
| `winword.exe`, `excel.exe` | `cmd.exe`, `powershell.exe`, `wscript.exe` | Un document Office qui lance un interpréteur (macro malveillante, T1204.002) |
| `w3wp.exe` (IIS) | `cmd.exe`, `powershell.exe` | Webshell possible |
| `services.exe` | binaire dans un dossier utilisateur | Service malveillant |
| `lsass.exe` | n'importe quoi | `lsass` ne lance normalement presque rien |

## 4. Linux : `auth.log` (SSH)

Les logs Unix sont du **texte libre** : il faut les parser.

```
Mar 14 09:12:41 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.45 port 51234 ssh2
```

| Élément | Valeur |
|---|---|
| Hôte | `web01` |
| Processus | `sshd` (PID 2211) |
| Résultat | `Failed password` |
| Compte | `admin`, marqué **`invalid user`** (n'existe pas) |
| Source | `203.0.113.45`, port `51234` |

Pour extraire les champs :

```spl
| rex "Failed password for (?:invalid user )?(?<user>\S+) from (?<src_ip>[\d\.]+) port (?<src_port>\d+)"
```

```
# Équivalent Grok (Logstash / ingest pipeline Elastic)
Failed password for (invalid user )?%{USERNAME:user} from %{IP:src_ip} port %{INT:src_port}
```

!!! warning "Le parsing se casse en silence"
    Si un correctif ou une mise à jour change le **format** du log, la regex ne matche plus : les champs sont vides et **les règles ne se déclenchent plus**, sans erreur. Surveille le taux de champs vides (voir [chapitre 2](02-architecture.md#6-la-qualite-des-donnees-le-sujet-quon-oublie)).

## 5. Pare-feu : clé=valeur

Beaucoup d'équipements réseau écrivent des paires `clé=valeur` :

```
date=2026-03-14 time=09:12:40 devname="FW01" action=deny srcip=203.0.113.45 srcport=51234 dstip=10.0.5.20 dstport=3389 proto=6 policyid=14
```

Lecture : `FW01` a **refusé** (`action=deny`) une connexion TCP (`proto=6`) de `203.0.113.45` vers le port **3389** (RDP) de `10.0.5.20`. Autre piège : l'heure est ici **sans fuseau** : vérifie en quelle zone l'équipement journalise avant de corréler.

## Exercice : relie les trois sources

Avec les trois logs ci-dessus, reconstitue la **chronologie en UTC** :

| Heure | Source | Ce qu'on apprend |
|---|---|---|
| 09:12:40 | Pare-feu | Une connexion RDP depuis `203.0.113.45` est (ici) refusée : vérifie si d'autres sont autorisées |
| 09:12:41 | Windows 4625 | Échec sur le compte `backup`, mauvais mot de passe |
| 09:18:07 | Sysmon 1 | `whoami /all` lancé sous `backup` |

??? question "Qu'est-ce que ça suggère de voir `action=deny` au pare-feu mais un 4625 sur le serveur depuis la même IP ?"
    Soit l'IP a **aussi** des connexions autorisées par une autre règle (exposition réelle), soit les **horodatages ou fuseaux sont décalés**, soit l'attaquant passe par un autre chemin. À vérifier : c'est un exemple de contradiction à **creuser**, pas à ignorer.

## Erreurs fréquentes

- Lire `SubjectUserName` au lieu de `TargetUserName` dans un 4625.
- Oublier que l'échec RDP avec NLA est en **type 3**.
- Comparer des heures **sans vérifier le fuseau** de chaque source.
- Ne pas regarder le **SubStatus** et rester sur le `Status` générique.
- Ignorer la ligne de commande complète d'un processus.

## À retenir

- Grille : **quand, où, qui, quoi, d'où**.
- `SubStatus` donne la **vraie cause** d'un échec de connexion.
- `TargetLogonId` relie une connexion à ses actions.
- Surveille les relations **parent → enfant**.
- Les logs texte exigent un **parsing** qui peut casser sans bruit.
