"""Valide les quiz JSON de docs/assets/quizzes/ et leur index.

Usage : python scripts/validate_quizzes.py
Aucune dépendance externe. Code de sortie 1 si une erreur est trouvée.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "docs"
QUIZ_DIR = ROOT / "assets" / "quizzes"


def check_quiz(path: Path) -> list[str]:
    errors = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"{path.name}: JSON invalide ({e})"]

    for key in ("id", "title", "questions"):
        if key not in data:
            errors.append(f"{path.name}: champ '{key}' manquant")
    if errors:
        return errors

    seen = set()
    for n, q in enumerate(data["questions"], 1):
        where = f"{path.name} Q{n} ({q.get('id', '?')})"
        for key in ("id", "q", "choices", "answer", "explain", "tags"):
            if key not in q:
                errors.append(f"{where}: champ '{key}' manquant")
        if errors and not all(k in q for k in ("id", "choices", "answer")):
            continue
        if q["id"] in seen:
            errors.append(f"{where}: id dupliqué")
        seen.add(q["id"])
        choices, answer = q["choices"], q["answer"]
        if len(choices) < 2:
            errors.append(f"{where}: au moins 2 choix requis")
        if not answer or any(not isinstance(a, int) or not 0 <= a < len(choices) for a in answer):
            errors.append(f"{where}: 'answer' invalide")
        if len(set(answer)) != len(answer):
            errors.append(f"{where}: 'answer' contient des doublons")
        if len(answer) == len(choices):
            errors.append(f"{where}: toutes les réponses sont correctes")
        if len(set(choices)) != len(choices):
            errors.append(f"{where}: choix dupliqués")
        if not str(q.get("explain", "")).strip():
            errors.append(f"{where}: explication vide")
        if not q.get("tags"):
            errors.append(f"{where}: au moins un tag requis")
    return errors


def main() -> int:
    errors = []
    files = sorted(p for p in QUIZ_DIR.glob("*.json") if p.name != "index.json")
    for path in files:
        errors += check_quiz(path)

    index_path = QUIZ_DIR / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        ids = {}
        for entry in index.get("quizzes", []):
            target = ROOT / entry["src"]
            if not target.exists():
                errors.append(f"index.json: {entry['src']} introuvable")
            else:
                ids[json.loads(target.read_text(encoding="utf-8")).get("id")] = entry["id"]
            # 'page' est l'URL relative du site (ex: cdsa/01-siem/07-quiz/)
            if not (ROOT / (entry["page"].rstrip("/") + ".md")).exists():
                errors.append(f"index.json: page {entry['page']} introuvable")
        for qid, eid in ids.items():
            if qid != eid:
                errors.append(f"index.json: id '{eid}' différent de l'id du fichier '{qid}'")
    else:
        errors.append("index.json manquant")

    total = 0
    for path in files:
        total += len(json.loads(path.read_text(encoding="utf-8"))["questions"])
    if errors:
        print("\n".join(errors))
        return 1
    print(f"OK : {len(files)} quiz, {total} questions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
