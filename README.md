# BlogPost

A full-stack publishing platform with private drafts, JWT authentication, and five games — including an online multiplayer tic-tac-toe with real-time matchmaking.

**Live demo:** https://blogsvault.netlify.app

---

## What it is

BlogPost is a blog platform where a post stays private until you choose to publish it, so it works equally as a personal journal or as a public blog. Alongside the writing side it hosts five games: an online multiplayer tic-tac-toe, a server-generated minesweeper, and three arcade games.

The project was built to work through the parts of a web app that tutorials skip — server-authoritative game state, an atomic matchmaking queue, and authentication that survives a real deployment rather than only localhost.

---

## How it was built

The frontend and the UI are mine. The backend and the game logic were built with substantial AI assistance and then audited file by file. The **Known limitations** section below is the record of what that audit turned up — it is there because the audit happened, not despite it.

---

## Features

**Blogging**

- Register and log in with JWT authentication
- Write posts as private drafts, publish when ready, unpublish again
- Edit and delete your own posts
- Public feed of published posts with pagination
- Per-post pages with author attribution
- Dark and light themes

**Games**

*Tic-tac-toe, three modes:*

- **Local two-player** — both players share one device
- **Versus the computer** — the opponent plays a win → block → centre → corner → any heuristic rather than moving at random
- **Online** — matched against a waiting opponent over Socket.IO, with draw offers in both directions and a per-turn timer

*Minesweeper:*

- Single-player, with the board generated server-side so mine positions never reach the client before a cell is revealed

*Aviator, Car Race and Wheels:*

- Aviator and Car Race each keep a personal best and a global leaderboard
- Wheels is an unscored spin-the-wheel game

**Accounts**

- bcrypt password hashing
- 30-day JWT sessions
- Forgot-password flow with a hashed, time-limited reset token
- Profile editing for username, email and password
- Protected routes on both the API and the client

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, React Router 7, Vite 7, CSS Modules, lucide-react |
| Backend | Node.js, Express 5, Socket.IO 4 |
| Database | MongoDB with Mongoose 8 |
| Auth | JWT, bcryptjs, express-rate-limit |
| Email | Nodemailer |
| Hosting | Netlify (frontend), Render (backend) |

---

## How the harder parts work

**Online tic-tac-toe is server-authoritative.** The client never decides an outcome. Each move is checked server-side: the match must be active, it must be that player's turn, and the cell must be empty. The winning lines are then evaluated against the server's own copy of the board. A tampered client can send whatever it likes; anything illegal is rejected.

**Matchmaking is a single atomic pop.** On request, the player inserts themselves into the queue and then performs one `findOneAndDelete` sorted by creation time, which claims the oldest waiting opponent in a single operation rather than reading and then writing. Two players cannot claim the same opponent concurrently.

**Score writes go through an authenticated endpoint.** The server knows who is posting and refuses any game name it does not recognise. What it cannot do is verify that the score was actually earned — see **Known limitations**.

**Reset tokens are hashed before storage.** The raw token goes into the email link; only its SHA-256 hash is stored, with a 15-minute expiry. A database leak therefore does not hand out working reset links.

**CORS is locked to the deployed frontend.** The origin is read from `FRONTEND_URL` with a localhost fallback for development, and the JWT travels in the `Authorization` header rather than a cookie.

---

## Running locally

**Requirements:** Node.js 18+, and a MongoDB instance (local or Atlas).

### Backend

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
| `FRONTEND_URL` | Allowed CORS origin and base for reset links |
| `EMAIL_USER` | Sender address for password-reset mail |
| `EMAIL_PASS` | App password for that address |

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5000` |

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## API reference

### Auth — `/api/auth`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | — | Create an account |
| POST | `/login` | — | Sign in, returns a JWT |
| POST | `/forgot-password` | — | Email a reset link |
| GET | `/me` | ✓ | Current user |
| PUT | `/profile/username` | ✓ | Change username |
| PUT | `/profile/email` | ✓ | Change email |
| PUT | `/profile/password` | ✓ | Change password |
| PUT | `/reset-password/:token` | — | Set a new password from a reset token |

### Blogs — `/api/blogs`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/public` | — | Published posts, paginated |
| GET | `/public/:id` | — | A single published post |
| GET | `/` | ✓ | Your own posts, drafts included |
| GET | `/:id` | ✓ | Your own post by id |
| POST | `/` | ✓ | Create a post |
| PUT | `/:id` | ✓ | Edit a post |
| PATCH | `/:id` | ✓ | Publish or unpublish a post |
| DELETE | `/:id` | ✓ | Delete a post |

### Games — `/api/games`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/join` | ✓ | Enter the matchmaking queue |
| POST | `/move` | ✓ | Submit a tic-tac-toe move |
| POST | `/score` | ✓ | Record a score |
| POST | `/minesweeper/start` | ✓ | Start a board |
| POST | `/minesweeper/reveal` | ✓ | Reveal a cell |
| POST | `/minesweeper/flag` | ✓ | Flag a cell |
| GET | `/best/:game` | ✓ | Your best score for one game |
| GET | `/leaderboard/:game` | — | Top five for a game |

### Socket.IO events

Client to server: `register`, `requestMatch`, `joinMatchRoom`, `makeMove`, `offerDraw`, `acceptDraw`, `refuseDraw`, `cancelDraw`, `disconnect`.

Server to client: `playerJoined`, `moveMade`, `timerUpdate`, `drawRefused`, `drawCanceled`, `gameFinished`.

---

## Known limitations

- **Single-player scores are computed on the client.** The server authenticates who is posting and rejects unknown game names, but it cannot verify that a score was actually earned — the Aviator crash point, for example, is generated in the browser. Closing this properly means moving the game loop server-side.
- **The online tic-tac-toe has no persistent record.** Wins, losses and draws live in component state and disappear on refresh, so it has no leaderboard. A real one needs a per-user tally rather than a single score field.
- **The matchmaking queue has no expiry.** A player who closes their tab while waiting leaves an entry behind. A TTL index on `createdAt` would clear it.
- **Password-reset email does not send in production.** Render blocks outbound SMTP on free instances, so reset mail fails there while the rest of the flow works. The fix is an HTTP email API on port 443 instead of SMTP.

---

## License

ISC
