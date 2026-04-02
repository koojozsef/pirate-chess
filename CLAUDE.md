# CLAUDE.md — Pirate Chess

## Project Overview

Pirate Chess is a turn-based hexagonal board game built with Django (backend) and vanilla JavaScript (frontend). Players compete on a 7x7 hexagonal grid using Warriors and Scouts, with a unique piece rotation mechanic that changes movement patterns.

## Repository Structure

```
pirate-chess/
├── pirate_chess_project/     # Django project config (settings, urls, wsgi, asgi)
├── game/                     # Main Django app
│   ├── models.py             # Game model (UUID PK, JSON board state)
│   ├── logic.py              # Core game engine (board, moves, validation)
│   ├── views.py              # REST API endpoints (5 endpoints)
│   ├── urls.py               # URL routing for game app
│   ├── tests.py              # Unit tests
│   ├── migrations/           # Django DB migrations
│   ├── static/game/
│   │   ├── css/styles.css    # Pirate-themed styling
│   │   └── js/script.js      # HexChess class (client-side logic, SVG rendering)
│   └── templates/game/
│       └── index.html        # Single-page app template
├── manage.py
├── package.json              # npm metadata + dev scripts
└── README.md
```

## Development Setup

```bash
# Apply migrations
python manage.py migrate

# Start the development server
python manage.py runserver 8000
# OR
npm start   # runs python3 -m http.server 8000 (static only, no Django features)
```

Use `python manage.py runserver 8000` for full functionality — the npm scripts only serve static files and won't handle API routes.

## Running Tests

```bash
python manage.py test game
```

Tests are in `game/tests.py` and use Django's `TestCase`. There is no JavaScript test suite.

## API Endpoints

All endpoints are under `/api/`:

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/new_game/` | Create a new game |
| GET | `/api/game/<uuid>/` | Fetch current game state |
| POST | `/api/game/<uuid>/move/` | Move a piece |
| POST | `/api/game/<uuid>/rotate/` | Rotate the last moved piece |
| POST | `/api/game/<uuid>/end_turn/` | End rotation phase, switch player |

## Game Mechanics

- **Board:** 7x7 hexagonal grid using cube coordinates `(q, r, s)`
- **Pieces per player:** 7 total — 4 Warriors, 3 Scouts
- **Player 1:** dark navy; **Player 2:** crimson red
- **Turn flow:** Select piece → Move (move phase) → Optionally rotate → End turn (rotate phase)
- **Win condition:** Capture all opponent pieces

### Piece Types

| Type | Movement |
|------|----------|
| Warrior | 1–3 hexes forward |
| Scout | 1 hex forward, left, or right |

Rotation is 0–5 (six 60-degree steps). Movement directions are recalculated based on the piece's current rotation.

## Key Code Conventions

### Backend (Python)

- **Coordinate keys** in the board dict are stored as strings in JSON: `board[str(q)][str(r)]`
- **Piece structure:** `{'type': 'warrior'|'scout', 'player': 1|2, 'rotation': 0-5}`
- **Validation functions** return tuples: `(is_valid: bool, error: str|None)`
- **Logic layer** (`logic.py`) is pure functions — no Django imports. Views handle HTTP; models handle persistence.
- Follow snake_case for all Python identifiers.

### Frontend (JavaScript)

- All client-side logic lives in the single `HexChess` class in `script.js`.
- State properties: `board`, `currentPlayer`, `gamePhase`, `selectedPiece`, `lastMovedPiece`
- API calls use `async/await`.
- SVG is built via `document.createElementNS()` — no canvas, no framework.
- Hexagonal rendering uses pointy-top hex-to-pixel conversion.
- Follow camelCase for all JS identifiers.

### General

- No external JS libraries or frontend build tools — keep the stack lean.
- Server-side validation is the source of truth; client-side only handles UX.
- Avoid adding new Python dependencies unless strictly necessary; Django is the only non-stdlib dependency.

## Django Configuration Notes

- `DEBUG = True` — change for production
- `SECRET_KEY` in `settings.py` is a placeholder — must be replaced before deploying
- `ALLOWED_HOSTS = []` — must be set for production
- Database: SQLite3 at `db.sqlite3` (fine for development; upgrade for production)
- CSRF middleware is active — API calls from JS must include the CSRF token

## Branch Conventions

- Feature/task branches follow `claude/<description>-<id>` pattern
- `main` is the stable branch
- Always develop on the designated feature branch; never push directly to `main`
