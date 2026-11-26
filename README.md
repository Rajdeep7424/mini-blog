# BlogPost

A full-stack publishing platform with private drafts and JWT authentication — plus five games, including an online multiplayer tic-tac-toe with matchmaking.

**Live demo:** https://blogsvault.netlify.app

---

## What it is

BlogPost is a blog platform where posts stay private until you choose to publish them — so it works equally as a personal journal or as a public blog. Alongside the writing side, it hosts five games: an online multiplayer tic-tac-toe, a server-generated minesweeper, and three scored arcade games.

The project exists to work through the parts of a web app that tutorials tend to skip: server-authoritative game state, atomic matchmaking under concurrency, and authentication flows that hold up when deployed rather than just on localhost.

---

## Features

**Blogging**

- Register and log in with JWT-based authentication
- Write posts as private drafts, publish when ready
- Edit and delete your own posts
- Public blog feed with pagination
- Per-post detail pages with author attribution
- Dark and light themes, persisted per user

**Games**

*Tic-tac-toe, in three modes:*

- **Local two-player** — both players take turns on the same device
- **Versus the computer** — the opponent uses a win → block → centre → corner → any heuristic rather than random play
- **Online** — matched against a waiting opponent over Socket.IO, with draw offers both ways

*Minesweeper:*

- Single-player, with the board generated on the server so the mine positions never reach the client until a cell is revealed

*Three arcade games:*

- Aviator and Car Race — each with a personal best and a global leaderboard
- Wheels — a spin-the-wheel game, unscored

**Accounts**

- bcrypt password hashing
- 30-day JWT sessions
- Forgot-password flow with a hashed, 15-minute reset token
- Rate limiting on auth endpoints
- Protected routes on both the API and the client

---

## Tech stack

| Layer | Stack |
|---|---|
| **Frontend** | React 19, React Router 7, Vite 7, CSS Modules, lucide-react |
| **Backend** | Node.js, Express 5, Socket.IO 4 |
| **Database** | MongoDB with Mongoose 8 |
| **Auth** | JWT, bcryptjs, express-rate-limit |
| **Email** | Nodemailer |
| **Deployment** | Netlify (frontend), Render (backend) |

---

## Architecture notes

How the harder parts work.

**The online tic-tac-toe is server-authoritative.** The client never decides the outcome. On every move the server validates that the match is active, that it's this player's turn, that the cell is empty, and then evaluates the winning lines against its own copy of the board. A tampered client can send whatever it likes; the server rejects anything illegal.

**Matchmaking is an atomic queue pop.** When you request a match, you insert yourself into the queue and then attempt a single `findOneAndDelete` sorted by creation time — which claims the oldest waiting opponent in one operation rather than a read followed by a write. That avoids two players claiming the same opponent concurrently.

**Game scores are server-written.** The client cannot post a score directly. Score updates go through the game's own authenticated route, and the game identifier is checked against an allowlist before it's used to build a database field path.

**Password reset tokens are hashed before storage.** The raw token goes in the email link; only its SHA-256 hash is persisted, with a 15-minute expiry. A database leak therefore doesn't hand out working reset links.

**The frontend is organised by feature, not by type.** Every page and component owns its own CSS Module beside it, so styles never leak across the app.

---

## Running locally

**Requirements:** Node.js 18+, a MongoDB instance (local or Atlas).

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `PORT` | Port to listen on (defaults to 5000) |
| `FRONTEND_URL` | Allowed origin for CORS and reset links |
| `EMAIL_USER` | Sender address for password-reset mail |
| `EMAIL_PASS` | App password for that address |

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend, e.g. `http://localhost:5000` |

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## API overview

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | — | Create an account |
| `/api/auth/login` | POST | — | Sign in, returns a JWT |
| `/api/auth/forgot-password` | POST | — | Email a reset link |
| `/api/auth/reset-password/:token` | POST | — | Set a new password |
| `/api/blogs` | GET | — | Public post feed |
| `/api/blogs/:id` | GET | — | Single post |
| `/api/blogs` | POST | ✓ | Create a post |
| `/api/blogs/:id` | PUT / DELETE | ✓ | Update or delete your post |
| `/api/games/join` | POST | ✓ | Enter the matchmaking queue |
| `/api/games/move` | POST | ✓ | Submit a move |
| `/api/games/minesweeper/start` | POST | ✓ | Start a board |
| `/api/games/minesweeper/reveal` | POST | ✓ | Reveal a cell |
| `/api/games/minesweeper/flag` | POST | ✓ | Flag a cell |
| `/api/games/best/:game` | GET | ✓ | Your best score for a game |
| `/api/games/leaderboard/:game` | GET | — | Top five for a game |

---

## Known limitations

- **Single-player games compute their score on the client.** The server authenticates who is posting and validates the game name, but it cannot verify that a score was actually earned — the crash point in Aviator, for example, is generated in the browser. Making these fully tamper-proof requires moving the game loop server-side. That's the next piece of work.
- **The online tic-tac-toe has no persistent record.** Wins, losses and draws live in component state and disappear on refresh, so there's no leaderboard for it. A proper one needs a win/loss/draw tally per user rather than a single score field.
- **The matchmaking queue has no expiry.** A player who closes their tab mid-wait leaves an entry behind. A TTL index on `createdAt` would fix it.
- **Password-reset email fails in production.** Render blocks outbound SMTP on free instances, so reset mail doesn't send there. The fix is an HTTP email API over port 443 rather than SMTP.

---

## License

ISC
