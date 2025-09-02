# Codex – projektové podklady (v1)

Tato složka obsahuje klíčové projektové dokumenty pro **Manipulator v3** ve formátu PDF.

## Soubory
- `1. Souhn cílu.pdf` – Souhrn hlavních cílů a rozsahu v1.
- `2. Logika systému (mozková vrstva).pdf` – Doménová logika, use‑cases, pravidla a procesy.
- `3. Vizuály a UX.pdf` – Wireframy, stavy UI, zásady brandingu ASSA ABLOY.
- `4. Architektura.pdf` – FE/BE stack, DB modely, API kontrakty, migrace.
- `5. Upřesňující body.pdf` – RBAC matice, SSE, DevOps/CI, audit logy, NFR.

> Doporučené umístění v repozitáři: `docs/codex/`.

---

## Rychlý návod k přidání do repozitáře

```bash
# v kořeni repozitáře
mkdir -p docs/codex
cp -R docs/codex/* docs/codex/  # pokud rozbalujete ze zipu v kořeni, tento krok upravte dle umístění

git checkout -b docs/codex-initial
git add docs/codex
git commit -m "docs(codex): přidány projektové podklady (PDF + README)"
git push -u origin docs/codex-initial
# poté otevřete Pull Request
```
