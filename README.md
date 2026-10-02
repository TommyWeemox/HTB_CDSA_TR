# SOC Lab — HTB CDSA & MITRE ATT&CK Defender

Environnement d'étude complet pour devenir analyste SOC / Threat Hunter / Detection Engineer.

- **HTB CDSA** (Certified Defensive Security Analyst)
- **MITRE ATT&CK Defender (MAD)** — Fundamentals, CTI, SOC Assessments, Threat Hunting & Detection, Adversary Emulation

## Contenu

| Dossier | Rôle |
|---|---|
| `docs/` | Site de notes (MkDocs Material) : cours, cheatsheets, plans d'étude, labs |
| `detections/` | Règles de détection versionnées (Sigma, SPL, KQL) |
| `hunts/` | Hunts documentés (hypothèse → données → requêtes → résultats) |
| `scripts/` | Outils utilitaires (parsing de logs, génération de checklist…) |

## Démarrage

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdocs serve        # http://127.0.0.1:8000
```

Build de contrôle : `mkdocs build --strict`.

## Déploiement

Un push sur `main` déclenche `.github/workflows/deploy.yml` (GitHub Pages, branche `gh-pages`).
Activer Pages : *Settings → Pages → Source : Deploy from a branch → `gh-pages`*.

## Conventions

- Une note = un sujet. Commencer par **Objectif**, finir par **À retenir** et **Pour aller plus loin**.
- Chaque technique est reliée à son ID ATT&CK (ex. `T1059.001`).
- Ne jamais committer de flags, de VPN `.ovpn`, de captures `.pcap`/`.evtx` (voir `.gitignore`).
- Le contenu officiel HTB/MITRE est reformulé avec ses propres mots, jamais copié.
