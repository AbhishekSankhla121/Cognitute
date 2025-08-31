FlipSwitch – Coding Assignment

Your task is to build a small but production-grade slice of a feature-flag service. The goal is not to finish a startup in 3 days, but to demonstrate your ability to design, implement, and ship a coherent full-stack solution.

Tech Stack (Required)

Frontend: React + Next.js (App Router, TypeScript)

Backend: Next.js API Routes (Node)

Database: PostgreSQL (Prisma ORM)

Cache: Redis

Auth: NextAuth (Google/GitHub)

Core Requirements
1. Authentication & Roles

Users log in via NextAuth (Google or GitHub).

Users belong to a workspace (seeded).

Roles:

Admin → manage flags

ReadOnly → view and evaluate

2. Feature Flags

Flags are boolean only.

Each flag includes:

key (string, unique per workspace)

defaultValue (true/false)

isEnabled (true/false)

rules[] → { attribute, comparator (=, in), value, rolloutPercentage }

3. Evaluation API

Endpoint: POST /api/v1/evaluate

Input: { flagKey, unitId, attributes }

Output: { value, reason }

Rules must be applied in order.

Implement deterministic bucketing:

hash <workspaceId>:<flagKey>:<unitId>


Use Murmur3 or similar for rollouts.

Cache compiled flags per workspace in Redis.

4. Realtime Updates

If a flag changes, connected clients should see updated configs via WebSocket within 2 seconds.

5. Admin Dashboard (Next.js)

Flags List page → show all flags for workspace.

Create/Edit Flag page → form with rule builder.

Test Evaluation panel → enter unitId + attributes to preview evaluated flag result in real time.

6. Audit Logs

Every flag create/update/delete must produce an audit entry.

Audit log page → filter by flag.

Non-Functional Requirements

Performance: flag evaluation p95 ≤ 100ms locally.

Bundle size: client JS on flags list ≤ 250KB gzipped.

Testing:

Unit tests for evaluation logic (≥ 80% coverage)

At least 1 API integration test

Deliverables

GitHub repo with:

/app → Next.js (dashboard + API routes)

/prisma → schema + migrations + seed script (seed 1 workspace, 2 users, 3 flags)

/docs → architecture diagram + 2 ADRs (Architecture Decision Records)

README.md → instructions to run locally

Short demo video (≤ 5 minutes) walking through:

Login

Create/Edit Flag

Live Test Evaluation

Audit Log

Bonus (Optional)

Add schedule start/end fields to flags.

Add a stubbed conversion events API (POST /api/v1/events).

What We’re Looking For

Correctness: rules, rollouts, evaluation

Architecture & Code Quality: modular evaluator, clean React patterns

Performance & Caching: Redis usage, low latency

Security: RBAC respected, input validated

Testing & Docs: meaningful coverage, ADRs, diagram

UX polish: rule builder, evaluation preview

Timebox

This assignment is designed to be achievable in approximately 3 focused days.
We’re not expecting perfection or polish everywhere—focus on depth, correctness, and clarity of design.

Submission

Please provide:

GitHub repo link

Demo video link

Any notes about trade-offs or shortcuts you took