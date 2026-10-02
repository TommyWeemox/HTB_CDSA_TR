---
tags: [detection, testing]
---

# Tester les détections

!!! danger "Sécurité"
    Exécute les tests uniquement dans ton lab isolé, jamais sur un système de production.

## Atomic Red Team

```powershell
Install-Module -Name invoke-atomicredteam -Scope CurrentUser
Import-Module invoke-atomicredteam
Invoke-AtomicTest T1059.001 -ShowDetails
Invoke-AtomicTest T1059.001 -TestNumbers 1
Invoke-AtomicTest T1059.001 -TestNumbers 1 -Cleanup
```

## Boucle de test

1. Lancer l'atomic correspondant à la technique.
2. Vérifier que les logs arrivent dans le SIEM.
3. Vérifier que la règle se déclenche.
4. Varier l'exécution (évasion) et noter les trous.
5. Documenter le résultat dans la règle.
