# Product Engineering Challenge Submission

## Candidate

- **Name:** Atharva Phanse
- **Email:** atharvaphanse403@gmail.com
- **GitHub:** https://github.com/Atharva45264
- **Selected problem:** Problem 3 — Reconnecting Real-Time Feed
- **Demo video:** https://drive.google.com/file/d/19ySCxZFD_1yePxiSi7sRLXUFg57jn1Hn/view?usp=drive_link 

---

## Run the project

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas or a local MongoDB instance

The project contains two applications:

```text
realtime-feed/
├── client/
└── server/
```

### Backend setup

Navigate to the backend:

```powershell
cd realtime-feed\server
```

Install dependencies:

```powershell
npm install
```

Create a `.env` file inside `realtime-feed/server`:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DATABASE=realtime_incident_feed
PORT=4000
```

Do not commit the `.env` file or any secret values.

Start the backend:

```powershell
npm run dev
```

The backend runs at:

```text
http://localhost:4000
```

WebSocket endpoint:

```text
ws://localhost:4000/ws
```

Health endpoint:

```text
http://localhost:4000/health
```

### Frontend setup

Open another terminal:

```powershell
cd realtime-feed\client
```

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

### Successful live-update scenario

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000` in two browser tabs.
4. Use the same incident ID in both clients.
5. Confirm both clients show `Connected`.
6. Publish an incident update from Client A.
7. Client B receives the update automatically without refreshing.

### Recovery scenario

1. Open the same incident feed in two clients.
2. Disconnect one client.
3. Publish incident updates while that client is away.
4. Return/reconnect the client using the same incident.
5. The client retrieves the missed updates from durable history.
6. The recovered updates appear in deterministic sequence order.

---

## Run the tests

### Backend tests

From `realtime-feed/server`:

```powershell
npm test
```

### Backend production build

```powershell
npm run build
```

### Frontend tests

From `realtime-feed/client`:

```powershell
npm test
```

### Frontend production build

```powershell
npm run build
```

The automated tests cover:

- WebSocket live publishing and broadcasting
- Sequence-based history retrieval
- Duplicate-safe merging of history and live updates
- Deterministic ordering by sequence

---

## Acceptance scenarios and verification

The implementation was verified against the five required acceptance criteria.

### AC1 — Live update

**Status: Verified**

Two clients were connected to the same incident.

An incident update published from Client A appeared automatically in Client B without a page refresh.

The WebSocket integration test also verifies that a published update is broadcast to connected clients subscribed to the same incident.

### AC2 — Connection state visible

**Status: Verified**

The client displays its current connection state.

During manual testing, the state changed as follows:

```text
Connected
    ↓
Backend stopped
    ↓
Reconnecting
    ↓
Backend restarted
    ↓
Connected
```

The browser did not need to be refreshed for the connection state to change.

### AC3 — Reconnect and recover missed updates

**Status: Verified**

A client was disconnected while updates were generated for the same incident.

When the client returned, the missed updates were retrieved from the persisted incident history and displayed in the feed.

The recovery design uses the latest known sequence as a cursor:

```text
Last known sequence
        ↓
Request updates after that sequence
        ↓
MongoDB durable history
        ↓
Recovered updates
        ↓
Merge with live updates
```

The manual verification confirmed that updates created while the client was away were available when the client returned.

### AC4 — Deduplication

**Status: Verified**

The client uses the stable update ID as the deduplication key.

The automated test specifically covers an update appearing in both the history and live update paths.

Example:

```text
History:
update-1
update-2

Live:
update-2
update-3

Merged result:
update-1
update-2
update-3
```

The overlapping `update-2` is retained only once.

Automated test:

```text
✓ deduplicates overlapping history and live updates
```

### AC5 — Deterministic ordering

**Status: Verified**

Each incident update receives an incident-specific sequence number.

For example:

```text
#1  First update
#2  Second update
#3  Third update
```

The client sorts updates by sequence, so the displayed order is deterministic even if incoming updates are not received in sequence order.

Automated test:

```text
✓ keeps updates ordered by sequence
```

---

## Problem-specific verification benchmark

The required behavior was verified using both automated tests and manual browser testing.

### Backend verification

```powershell
cd realtime-feed\server
npm test
```

Observed result:

```text
Test Files  2 passed (2)
Tests       2 passed (2)
```

The backend tests verified:

```text
✓ Sequence-based history retrieval
✓ WebSocket live publishing and broadcasting
```

### Frontend verification

```powershell
cd realtime-feed\client
npm test
```

Observed result:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
```

The frontend tests verified:

```text
✓ Deduplication of overlapping history/live updates
✓ Deterministic ordering by sequence
```

### Backend production build

```powershell
cd realtime-feed\server
npm run build
```

Observed result:

```text
TypeScript compilation completed successfully.
```

### Frontend production build

```powershell
cd realtime-feed\client
npm run build
```

Observed result:

```text
Compiled successfully
Finished TypeScript
Collecting page data
Generating static pages
Finalizing page optimization
```

The generated application routes were:

```text
/
/features
/how-it-works
```

---

## Failure and recovery scenario demonstrated

The demonstrated recovery scenario is:

```text
Client A                         Client B

Connected                        Connected
    │                                │
    │                                X disconnected
    │
    ├── Update #1                    │
    ├── Update #2                    │
    └── Update #3                    │
                                     │
                              client returns
                                     │
                                     ↓
                              recover history
                                     │
                              Update #1
                              Update #2
                              Update #3
```

The key design property is that the WebSocket connection is temporary, while incident history is persisted in MongoDB.

Therefore, updates do not depend solely on the client maintaining a continuous WebSocket connection.

---

## Architecture and data flow

The application consists of four main parts:

1. Next.js frontend
2. Node.js/Express backend
3. WebSocket server
4. MongoDB persistence

### High-level architecture

```text
                    ┌─────────────────────┐
                    │    Next.js Client   │
                    │                     │
                    │ Live Feed UI        │
                    │ Connection state    │
                    │ Recovery cursor     │
                    │ Deduplication       │
                    └──────────┬──────────┘
                               │
                         REST / WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express   │
                    │                     │
                    │ REST API            │
                    │ WebSocket server    │
                    │ Update services     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │                     │
                    │ updates collection  │
                    │ sequences collection│
                    └─────────────────────┘
```

### Live update flow

```text
Client A
   │
   │ WebSocket publish
   ▼
WebSocket server
   │
   ├── Validate message
   │
   ├── Generate sequence number
   │
   ├── Generate stable update ID
   │
   ├── Persist update
   │
   └── Broadcast update
          │
          └──────────────► Connected clients
```

### Recovery flow

```text
Client disconnects
        │
        ▼
Updates continue to be persisted
        │
        ▼
Client reconnects
        │
        ▼
Client uses last known sequence
        │
        ▼
Server queries durable history
        │
        ▼
Updates after cursor are returned
        │
        ▼
Client merges recovered + live updates
        │
        ▼
Deduplicate by stable update ID
        │
        ▼
Sort by sequence
```

The important architectural distinction is that **WebSocket delivery is transient while MongoDB history is durable**.

---

## Technology choices

### Next.js

Next.js was used for the frontend because it provides a structured React application with routing and production build tooling.

An alternative would have been React with Vite.

The trade-off is additional framework conventions, but Next.js provides a convenient structure for the multiple application pages and production build.

### Node.js and Express

Node.js with Express was selected for the backend because the application is primarily I/O-driven and needs both HTTP and WebSocket communication.

Express handles the REST endpoints while the `ws` package handles WebSocket connections.

An alternative could have been FastAPI or another backend framework.

### MongoDB

MongoDB was chosen for durable incident history and sequence state.

The update records are relatively simple documents, making MongoDB a straightforward persistence choice for this prototype.

### WebSockets

WebSockets were selected because the requirement is for connected clients to receive updates without polling or refreshing the page.

The trade-off is that WebSocket connections are temporary. The implementation addresses this by keeping durable history in MongoDB rather than treating the WebSocket connection as the source of truth.

---

## Important decisions

### 1. Sequence numbers instead of timestamps

Each incident has its own sequence counter.

New updates receive the next sequence number:

```text
1 → First update
2 → Second update
3 → Third update
```

This provides deterministic ordering and allows recovery using:

```text
sequence > lastKnownSequence
```

This avoids relying on timestamp precision or client/server clock differences for ordering.

### 2. Stable IDs for deduplication

Every update receives a UUID.

The client uses this ID when merging updates from different delivery paths.

This is important because the same update can potentially appear in both recovered history and live delivery.

### 3. Durable history separate from live delivery

The WebSocket connection is treated as a delivery mechanism, not the source of truth.

MongoDB stores the incident history independently of active client connections.

This allows a reconnecting client to request updates that were missed while it was disconnected.

---

## Assumptions and limitations

The following limitations are intentional and within the scope of the challenge:

- Authentication and authorization are not implemented.
- Clients are assumed to know the incident ID they want to subscribe to.
- Offline creation of updates is out of scope.
- Updates are append-only.
- Editing and deleting updates are not implemented.
- Presence, typing indicators, reactions, and attachments are not implemented.
- The WebSocket client registry is maintained in backend process memory.
- The prototype is designed around a single backend instance.
- Total historical storage is currently unbounded.
- Individual recovery queries are bounded to a maximum of 100 updates.
- Internet-scale load testing was not performed.
- REST-created updates are persisted through the REST API; the application's primary live publishing path is WebSocket publishing.
- Authentication, authorization, rate limiting, and multi-tenant isolation are outside the challenge scope.

---

## Production and scale

The submitted implementation is intentionally a focused prototype.

### What the submitted implementation does

- Stores incident updates in MongoDB.
- Maintains incident-specific sequence state.
- Uses WebSockets for live delivery.
- Tracks the client's latest sequence.
- Retrieves missed updates after a sequence cursor.
- Deduplicates updates using stable IDs.
- Orders updates deterministically using sequence numbers.
- Shows connection state to the user.

### What would change for production scale

#### 1. Multi-instance WebSocket delivery

The current connection registry exists in the memory of a single backend process.

If multiple backend instances were introduced, clients connected to different instances would not automatically share the same in-memory connection registry.

A production architecture could introduce Redis Pub/Sub, NATS, Kafka, or another messaging mechanism so updates can be distributed between backend instances.

#### 2. History retention

The current prototype does not automatically delete old updates.

Production would need a defined retention policy, such as:

```text
hot history
    ↓
retention window
    ↓
archive/delete
```

The appropriate policy would depend on the product requirements.

#### 3. Observability

Production monitoring should track metrics such as:

- Active WebSocket connections
- Connection failures
- Reconnection frequency
- Recovery requests
- Recovery backlog size
- Publish latency
- MongoDB latency/errors
- WebSocket broadcast failures

Structured logs and distributed tracing would also be useful.

#### 4. Security

Production would require:

- Authentication
- Authorization
- Input/rate limiting
- Secure WebSocket connections
- Tenant isolation
- Appropriate database access controls

These improvements are proposed production changes and are not claimed as implemented in this submission.

---

## AI usage

AI tools were used during development as an engineering assistance tool.

AI assistance was used for:

- Exploring implementation approaches
- Reviewing code structure
- Debugging TypeScript and integration issues
- Suggesting test cases
- Reviewing recovery and deduplication logic
- Improving frontend structure and presentation
- Drafting project documentation

The generated suggestions were reviewed manually rather than being accepted without verification.

The final implementation was validated through:

- Backend automated tests
- Frontend automated tests
- TypeScript production builds
- Manual live-update testing
- Manual connection-state testing
- Manual recovery testing

AI assistance was therefore treated as a development aid, while correctness was verified against the actual running application and test suite.

---

## Credibility note

### NewsNaut — AI Powered News Aggregator & YouTube Tracker

**Problem solved**

NewsNaut is an AI-powered news aggregation application that collects news from multiple sources, organizes it into categories, generates AI summaries, tracks selected YouTube channels, and delivers a daily digest.

**Personal contribution**

I worked on the application across the backend, database layer, news aggregation pipeline, AI summarization flow, YouTube tracking, and automated email digest workflow.

The project uses FastAPI, MongoDB, RSS feeds, YouTube transcript tooling, and an LLM-based summarization pipeline.

**Scale / operational complexity**

The application combines multiple external data sources, scheduled processing, database persistence, AI processing, and automated email delivery.

The backend and scheduled workflows were deployed so that the application could continue processing without relying on a local development environment.

**Difficult engineering decision**

One significant engineering decision was moving the persistence layer from PostgreSQL to MongoDB while keeping the existing aggregation and summarization workflow functional.

This required adapting the data access layer and persistence logic while maintaining the rest of the application's workflow.

**Evidence**

GitHub repository:

https://github.com/Atharva45264/NewsNaut
