# Sports Engine

A real-time sports commentary and score update engine built with Node.js. This application provides a RESTful API for managing matches and publishing live updates, along with a WebSocket server for broadcasting real-time events to connected clients.

## Features

- **Match Management**: Create matches, update scores, and list recent matches.
- **Live Commentary**: Post commentary updates for ongoing matches.
- **Real-time Broadcasting**: WebSocket server pushes match creation, score updates, and commentary to subscribers instantly.
- **Data Validation**: Robust request validation using Zod.
- **Performance Monitoring**: Integrated with APM Insight.
- **Security**: Basic security features with Arcjet (bot detection/rate limiting).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM
- **Real-time**: WebSocket (`ws`)
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
- A PostgreSQL database (e.g., local or Neon)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory. You can copy the example below:

    ```bash
    # Database Connection
    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

    # Server Configuration
    PORT=8000
    HOST=0.0.0.0

    # Security (Arcjet)
    ARCJET_KEY="your_arcjet_key"
    ARCJET_ENV="development"

    # APM Insight Agent Key (Required for monitoring)
    # Note: Do not commit this key to version control.
    APMINSIGHT_LICENSE_KEY="your_apminsight_license_key"
    ```

### Database Setup

This project uses Drizzle Kit for database migrations.

1.  **Generate migrations**:
    ```bash
    npm run db:generate
    ```

2.  **Apply migrations**:
    ```bash
    npm run db:migrate
    ```

### Running the Application

- **Development Mode** (with watch):
    ```bash
    npm run dev
    ```

- **Production Start**:
    ```bash
    npm start
    ```

The server will start on `http://localhost:8000` (or your configured port).
The WebSocket server runs on the same port at `/ws`.

## API Reference

### Matches

#### `GET /matches`
List recent matches.
- **Query Params**: `limit` (default 50, max 100)

#### `POST /matches`
Create a new match.
- **Body**:
    ```json
    {
      "sport": "football",
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "startTime": "2023-10-27T10:00:00Z",
      "endTime": "2023-10-27T12:00:00Z"
    }
    ```

#### `PATCH /matches/:id/score`
Update the score of a match.
- **Body**:
    ```json
    {
      "homeScore": 1,
      "awayScore": 0
    }
    ```

### Commentary

#### `POST /matches/:id/commentary`
Add a commentary entry for a match.
- **Body**:
    ```json
    {
      "message": "What a goal!",
      "minute": 15,
      "type": "goal"
    }
    ```

#### `GET /matches/:id/commentary`
Get commentary for a match.

## WebSocket Events

Connect to `ws://localhost:8000/ws`.

### Client -> Server
- **Subscribe**: `{"type": "subscribe", "matchId": 1}`
- **Unsubscribe**: `{"type": "unsubscribe", "matchId": 1}`

### Server -> Client
- **Match Created**: Broadcasts new match details to all clients.
    ```json
    { "type": "match_created", "data": { ... } }
    ```
- **Score Update**: Sent to subscribers of a specific match.
    ```json
    { "type": "score_update", "data": { "matchId": 1, "homeScore": 1, "awayScore": 0 } }
    ```
- **Commentary**: Sent to subscribers of a specific match.
    ```json
    { "type": "commentary", "data": { "matchId": 1, "message": "...", ... } }
    ```
