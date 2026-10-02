# Examen CDSA

## Format (source officielle HTB)

- Activités d'**analyse de sécurité, d'opérations SOC et de gestion d'incident** menées contre **plusieurs réseaux réalistes et hétérogènes**, hébergés par HTB.
- Accès via **VPN** (Pwnbox ou VM locale) : il suffit d'une connexion stable et d'un client VPN.
- Une **lettre d'engagement** fournie au démarrage précise le périmètre, les exigences et les objectifs.
- La certification évalue à la fois l'**analyse d'incident** et la **communication professionnelle** de l'incident : le rapport compte autant que l'investigation.

!!! warning "À vérifier"
    Durée, nombre de questions/objectifs et critères de réussite : consulte la page officielle de l'examen. Ils ne figurent pas dans ce dépôt pour ne pas diffuser d'informations erronées.

## Ce que ça implique pour ta préparation

| Constat | Conséquence |
|---|---|
| Réseaux **hétérogènes** | Sois à l'aise avec **plusieurs sources** (Windows, Linux, réseau) et **plusieurs outils** (ELK **et** Splunk) |
| Activités **pratiques** | Les quiz aident à mémoriser ; seuls les **labs** te préparent vraiment |
| **Communication** de l'incident | Entraîne-toi à rédiger : résumé, chronologie UTC, IOC, ATT&CK, recommandations |
| **Lettre d'engagement** | Lis le périmètre **avant** d'agir et ne sors pas du cadre |

## Stratégie

1. **Cadrer** : lire la lettre d'engagement en entier, lister objectifs et contraintes, noter l'heure de début.
2. **Chronologie** : bâtir une timeline dès les premiers indices (qui, quoi, quand, où).
3. **Pivoter** : IOC → hôte → utilisateur → processus parent → réseau.
4. **Capturer** : requêtes et captures d'écran **au fil de l'eau**.
5. **Rédiger pendant l'investigation**, pas après.

## Checklist avant l'examen

- [ ] Cheatsheets SPL / KQL / EQL à portée de main
- [ ] Event IDs Windows et Sysmon connus par cœur
- [ ] Template de rapport prêt ([templates](../resources/templates.md))
- [ ] 2 examens blancs chronométrés réalisés
- [ ] VPN et environnement de capture testés

## Retour d'expérience

Note ici les erreurs faites en examen blanc et les actions correctives.
