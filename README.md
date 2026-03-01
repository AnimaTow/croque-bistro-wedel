# Croque Bistro Zukunft

Next.js 16 App fuer Croque Bistro Wedel mit:
- Startseite (`/`)
- Zukunftsumfrage (`/zukunft` lokal, live ueber Subdomain)
- interner Auswertung (`/auswertung`, per Flag schaltbar)
- API fuer Feedback inkl. Spam-/Mehrfachschutz

## Tech Stack

- Next.js `16.1.6` (App Router)
- React `19.2.3`
- TypeScript
- Tailwind CSS v4
- SQLite via `better-sqlite3`

## Projektstruktur

- `src/app/page.tsx`: Startseite
- `src/app/zukunft/page.tsx`: Umfrage-Frontend
- `src/app/auswertung/page.tsx`: Auswertung (geschuetzt per Env-Flag)
- `src/app/api/feedback/route.ts`: API fuer Vote/Status/Update/Delete
- `src/middleware.ts`: Host/Subdomain-Routing und Unknown-Host-404
- `src/lib/db.ts`: DB-Zugriff (SQLite)
- `feedback.db`: lokale SQLite-Datei

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App unter `http://localhost:3000`.

Wichtige Seiten lokal:
- Startseite: `http://localhost:3000/`
- Umfrage: `http://localhost:3000/zukunft`
- Auswertung: `http://localhost:3000/auswertung` (nur wenn freigeschaltet)

## Qualitaetschecks

```bash
npm run lint
npx tsc --noEmit
```

## Umgebungsvariablen

Beispiel liegt in `.env.example`.

```env
FEEDBACK_VOTE_PEPPER=please-change-this-to-a-long-random-secret
FEEDBACK_RESULTS_ENABLED=false
FEEDBACK_RESULTS_PATH=/auswertung
FEEDBACK_ALLOW_SELF_DELETE=false
```

Bedeutung:
- `FEEDBACK_VOTE_PEPPER`: Secret fuer Hash-Bildung der Vote-Identitaet (in Produktion lang/random setzen)
- `FEEDBACK_RESULTS_ENABLED`:
  - `false`: Auswertung bleibt privat, bereits abstimmende Nutzer bleiben in der Self-Service-Ansicht
  - `true`: Auswertung ist freigeschaltet, bereits abstimmende Nutzer werden dorthin geleitet
- `FEEDBACK_RESULTS_PATH`: Zielpfad der Auswertung
- `FEEDBACK_ALLOW_SELF_DELETE`: erlaubt Test-Reset (eigene Stimme loeschen)

## Voting- und Spam-Schutz

Die API (`/api/feedback`) nutzt mehrere Schutzmechanismen:
- Bot-Honeypot (`website` Feld)
- Eindeutige Stimme pro Nutzerkontext ueber `voterHash`
  - Hash aus `IP + User-Agent + FEEDBACK_VOTE_PEPPER`
- Persistente Cookies:
  - `feedback_voted`
  - `feedback_edit_token`
- Bereits abgestimmte Nutzer koennen (vor Freischaltung) eigene Angaben einsehen und Teilbereiche anpassen.

## API Uebersicht

- `GET /api/feedback`
  - liefert Vote-Status, Results-Status und eigene gespeicherte Angaben
- `POST /api/feedback`
  - legt neue Stimme an (validiert Pflichtfelder und Regeln)
- `PATCH /api/feedback`
  - aktualisiert eigene Angaben (z. B. Name/Benachrichtigung), nur solange Auswertung nicht freigeschaltet ist
- `DELETE /api/feedback`
  - loescht eigene Stimme (nur wenn `FEEDBACK_ALLOW_SELF_DELETE=true`)

## Routing: lokal vs. live

### Lokal
- Entwicklung ueber Pfad `/zukunft`.

### Live (Subdomain-Modell)
Middleware in `src/middleware.ts`:
- `zukunft.croque-bistro.de` wird intern auf `/zukunft` geroutet
- Hauptdomain (`croque-bistro.de`, `www.croque-bistro.de`) bleibt auf `/`
- Unbekannte Hosts/Subdomains, die auf diese App zeigen, erhalten eine eigene 404-Antwort mit `noindex`

Hinweis: Vor der App kann Nginx laufen. `shop.croque-bistro.de` kann extern bleiben, solange es nicht auf diese Next.js-Instanz zeigt.

## Datenschutz-Hinweise (technisch)

- Keine Marketing-Logik in der Umfrage
- Optionale Benachrichtigung nur mit Einwilligung
- E-Mail wird nur fuer Ergebnis-Info genutzt (laut UX-/Copy-Konzept)
- Oeffentlicher Name ist optional (Pseudonym/anonym moeglich)

## Deployment Kurz-Checkliste

1. `.env` in Produktion setzen (insb. `FEEDBACK_VOTE_PEPPER`)
2. DB-Pfad/Storage persistent bereitstellen (`feedback.db`)
3. Reverse Proxy Header korrekt setzen (`x-forwarded-for`)
4. Domains/Subdomains in DNS + Nginx konfigurieren
5. `FEEDBACK_RESULTS_ENABLED` erst aktivieren, wenn Auswertung live gehen soll

## Git Setup (falls neu)

```bash
git init
git add .
git commit -m "Initial commit"
```

Remote anbinden:

```bash
git remote add origin <REPO_URL>
git branch -M main
git push -u origin main
```
