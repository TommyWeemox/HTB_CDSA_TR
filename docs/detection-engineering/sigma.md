---
tags: [detection, sigma]
---

# Sigma

Format YAML générique de règles de détection, convertible vers Splunk, Elastic, Sentinel, etc.

## Exemple

```yaml
title: PowerShell encodé suspect
id: 00000000-0000-0000-0000-000000000001
status: experimental
description: Détecte PowerShell lancé avec une commande encodée
tags: [attack.execution, attack.t1059.001]
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\powershell.exe'
    CommandLine|contains:
      - ' -enc '
      - ' -EncodedCommand '
  condition: selection
falsepositives:
  - Scripts d'administration légitimes
level: medium
```

## Conversion

```powershell
pip install sigma-cli
sigma plugin install splunk elasticsearch
sigma convert -t splunk -p sysmon detections/sigma/
```

## Bonnes pratiques

- Un `tags` ATT&CK par règle, `falsepositives` renseigné, `level` argumenté.
- Cibler le comportement plutôt qu'un nom d'outil.
