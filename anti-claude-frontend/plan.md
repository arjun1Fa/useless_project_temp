# ANTI-CLAUDE — SYSTEM IMPLEMENTATION PLAN & ROADMAP

> **Project:** Anti-Claude (Inverted AI-Human Dorm Room Crisis Application)  
> **Persona Archetype:** Desperate Undergraduate College Student  
> **Target LLMs:** Grok API (xAI — Persona, Crises, Rants) + Gemini API (Google — Multimodal Screenshot & Vision Analysis)  
> **Architecture Pattern:** Monorepo with Two Decoupled Frontends (:3000 & :3001) & Express + Socket.io Backend (:4000)  
> **Database:** PostgreSQL via Prisma + Docker Compose  
> **Document Version:** 2.1.0  

---

## 1. Executive Summary & Architectural Overview

**Anti-Claude** is an AI agent application that inverts the traditional AI assistant dynamic. Instead of a human asking an AI for homework help, **Anti-Claude** is an exhausted, procrastinating, emotionally volatile undergraduate college student who bombards the human with urgent real-life crises:
- Writing pickup lines for a crush in Bio 101 based on her Instagram story.
- Drafting 5-page essays 12 minutes before the Canvas portal locks.
- Formulating excuses for angry professors.
- Mediating radioactive dorm-room microwave disputes.

When the human responds with text, screenshots, or files, **Gemini API** analyzes any uploaded visual proofs, while **Grok API** evaluates the overall advice with dramatic student flair. If the advice is good, Anti-Claude celebrates wildly. If the response is subpar, robotic, or unhelpful, Anti-Claude erupts in genuine, relatable college-student frustration (*"Bro, did you write this with your elbows?! My professor is going to expel me!"*).

```text
       ┌─────────────────────┐                 ┌───────────────────────┐
       │   GROK API (xAI)    │                 │   GEMINI API (Google) │
       │ Persona, Tasks &    │                 │  Multimodal Vision &  │
       │ Frantic Evaluations │                 │  Screenshot Analysis  │
       └──────────┬──────────┘                 └───────────┬───────────┘
                  │ (Structured JSON)                      │ (Visual Critique)
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ENGINE (Express + TypeScript)                         │
│                                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────────────────┐  │
│  │   AI Orchestrator    │   │     Task Engine      │   │     Crisis Scheduler        │  │
│  │  • Undergrad Prompt  │   │  • State Machine     │   │  • Proactive 2 AM Panics    │  │
│  │  • Dual-LLM Pipeline │   │  • Response Ingestion│   │  • Idle Wingman Nudges      │  │
│  │  • Hybrid Fallback   │   │  • GPA/Bro-Score Calc│   │  • Deadline Countdown Clock │  │
│  └──────────────────────┘   └──────────────────────┘   └─────────────────────────────┘  │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────────────────┐  │
│  │ Academic Tier Engine │   │ Roommate Dynamics    │   │      Trigger Engine         │  │
│  │  • Bro Standing      │   │  • Trust/Annoyance   │   │  • Instant Demo Panic       │  │
│  │  • Milestone Decrees │   │  • Emotional State   │   │  • 11:59 Canvas Emergency   │  │
│  └──────────────────────┘   └──────────────────────┘   └─────────────────────────────┘  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │         REST API Layer (Express) & WebSocket Real-time Gateway (Socket.io)        │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
  │     POSTGRESQL DB      │   │    ANTI-CLAUDE UI      │   │       HUMAN UI         │
  │    (Docker Compose)    │   │  (Port 3000 — Vite)    │   │  (Port 3001 — Vite)    │
  │                        │   │                        │   │                        │
  │ • Wingman Profiles     │   │ • Dorm Panic Cockpit   │   │ • Wingman Hotline Deck │
  │ • Task Lifecycle       │   │ • Thought/Panic Stream │   │ • Incoming Crisis Feed │
  │ • Messages & Proofs    │   │ • Caffeine/Anxiety Bar │   │ • Response/Upload Area │
  │ • Campus Lore / Memory │   │ • Canvas Countdown Tab │   │ • Bro Standing Badge   │
  │ • Evaluations & Melts  │   │ • Crush Status Tracker │   │ • DND Toggle (Betrayal)│
  │ • Frictionless Auto-ID │   │ • Live Rant Broadcasts │   │ • Emergency Siren HUD  │
  │                        │   │ • Audio SFX (Ticking)  │   │ • Audio SFX (Klaxon)   │
  └────────────────────────┘   └────────────────────────┘   └────────────────────────┘
```

---

## 2. Decoupled Monorepo Structure

```text
anti-claude/
├── apps/
│   ├── backend/                     # Node.js + Express + Socket.io Server (:4000)
│   │   ├── src/
│   │   │   ├── ai/                  # AI Orchestrator Layer
│   │   │   │   ├── grok.client.ts   # xAI Grok client for student persona & rants
│   │   │   │   ├── gemini.client.ts # Google Gemini client for multimodal vision
│   │   │   │   ├── fallback.data.ts # Pre-compiled campus crises & roasts
│   │   │   │   ├── prompts/         # Collegiate system prompts & slang catalog
│   │   │   │   ├── crisis-gen.ts    # Task generation agent
│   │   │   │   ├── evaluator.ts     # Combined evaluation agent (Grok + Gemini)
│   │   │   │   └── memory.ts        # Campus lore compressor
│   │   │   ├── api/                 # REST Route controllers
│   │   │   │   ├── tasks.routes.ts  # /tasks endpoints (crises, responses)
│   │   │   │   ├── employee.routes.ts # /employee endpoints (wingman profile, GPA)
│   │   │   │   ├── admin.routes.ts  # /admin demo controls (instant panics, reset)
│   │   │   │   └── upload.routes.ts # /attachments endpoints (screenshots, notes)
│   │   │   ├── engine/              # Deterministic business logic
│   │   │   │   ├── task.machine.ts  # Finite State Machine for tasks
│   │   │   │   ├── scheduler.ts     # Proactive 2 AM cron & idle timer
│   │   │   │   ├── promotion.ts     # Bro Standing / Academic Tier progression
│   │   │   │   └── trigger.ts       # Manual emergency trigger engine
│   │   │   ├── events/              # Real-time WebSocket Gateway
│   │   │   │   ├── ws.server.ts     # Socket.io server with dual rooms
│   │   │   │   └── event.bus.ts     # Typed event emitter & broadcaster
│   │   │   ├── storage/             # File/screenshot upload handler (Local disk)
│   │   │   └── index.ts             # Server entrypoint
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── anti-claude-ui/              # Port 3000: Vite + React + Tailwind + Framer Motion
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── PanicTerminal.tsx # Grok stream of consciousness & frantic thoughts
│   │   │   │   ├── AnxietyMeter.tsx  # Dynamic caffeine and panic gauges
│   │   │   │   ├── CrushStatus.tsx   # Fictional crush tracker ("Maya from Econ")
│   │   │   │   ├── CanvasPortal.tsx  # Mock Canvas submission clock
│   │   │   │   ├── WingmanSpy.tsx    # Real-time monitor of human (Idle/Typing/Ghosting)
│   │   │   │   ├── MeltdownFeed.tsx  # Live roasts and frustration rants
│   │   │   │   └── AdminDemoBar.tsx  # Presenter buttons (Trigger Crisis, Reset, Dial)
│   │   │   ├── hooks/
│   │   │   │   ├── useAISocket.ts   # Socket.io listener for AI deck
│   │   │   │   └── useAudioSFX.ts   # UI sound effects manager
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts           # Server port 3000
│   │
│   └── human-ui/                    # Port 3001: Vite + React + Tailwind + Framer Motion
│       ├── src/
│       │   ├── components/
│       │   │   ├── CrisisInbox.tsx  # Incoming urgent requests from Anti-Claude
│       │   │   ├── CrisisActiveCard.tsx # Active task card with ticking countdown
│       │   │   ├── ResponseEditor.tsx # Text submission + screenshot dropzone
│       │   │   ├── WingmanBadge.tsx # Visual Bro-Standing ID (e.g. "Certified Wingman")
│       │   │   ├── GpaTracker.tsx   # Visual GPA & Loyalty meter
│       │   │   ├── EmergencyHUD.tsx # Red flashing borders for 11:59 PM panics
│       │   │   └── DNDSwitch.tsx    # "Sleep" switch (provokes student outrage)
│       │   ├── hooks/
│       │   │   ├── useSocket.ts     # Socket.io synchronization hook
│       │   │   ├── useTask.ts       # Task response mutation hooks
│       │   │   └── useAudioSFX.ts   # UI sound effects manager (Klaxon, Airhorn)
│       │   ├── pages/
│       │   └── App.tsx
│       ├── package.json
│       └── vite.config.ts           # Server port 3001
│
├── packages/
│   ├── database/                    # Prisma schema, migrations, client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts              # Pre-seeds default "Unpaid Roommate" profile
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── client.ts
│   │   └── package.json
│   │
│   ├── shared-types/                # Shared TypeScript contracts & Zod schemas
│   │   ├── src/
│   │   │   ├── crisis.types.ts
│   │   │   ├── wingman.types.ts
│   │   │   ├── events.types.ts
│   │   │   ├── llm.schemas.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                          # Shared UI primitives (Buttons, Badges, Modals)
│       ├── src/
│       └── package.json
│
├── docker-compose.yml               # PostgreSQL 16 container
├── package.json
├── turbo.json
└── README.md
```

---

## 3. Database Schema Specification (Prisma + PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TaskStatus {
  CREATED
  DELIVERED
  SEEN
  RESPONDED
  EVALUATING
  EVALUATED
  CLOSED
  IGNORED
  REJECTED
  EXPIRED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ExpectedResponseType {
  TEXT
  IMAGE
  FILE
  TEXT_OR_IMAGE
}

enum AcademicStanding {
  ACADEMIC_PROBATION      // 0 - 4 pts (Unpaid Classmate)
  STUDY_GROUP_STRAY       // 5 - 9 pts
  RELIABLE_LAB_PARTNER    // 10 - 19 pts
  LATE_NIGHT_CRAM_BUDDY   // 20 - 34 pts
  CERTIFIED_WINGMAN       // 35 - 59 pts
  CAMPUS_SAVIOR           // 60 - 99 pts (Dean's List Hero)
  BROTHER_FOR_LIFE        // 100+ pts (Honorary Degree Holder)
}

enum CrisisCategory {
  ACADEMIC_CRAM
  CRUSH_DILEMMA
  ROOMMATE_WARFARE
  PROFESSOR_NEGOTIATION
  DORM_SURVIVAL
}

model User {
  id              String           @id @default(uuid())
  email           String           @unique @default("roommate@campus.edu")
  name            String           @default("The Unpaid Roommate")
  role            String           @default("WINGMAN")
  employeeProfile EmployeeProfile?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model EmployeeProfile {
  id                  String           @id @default(uuid())
  userId              String           @unique
  user                User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  rank                AcademicStanding @default(ACADEMIC_PROBATION)
  score               Int              @default(0) // Bro Score
  gpa                 Float            @default(2.1) // 0.0 - 4.0 scale
  tasksCompleted      Int              @default(0)
  tasksIgnored        Int              @default(0)
  tasksRejected       Int              @default(0)
  tasksFailed         Int              @default(0)
  averageResponseTime Float            @default(0.0) // seconds
  loyaltyScore        Int              @default(50)  // 0 - 100
  creativityScore     Int              @default(50)  // 0 - 100
  absurdityLevel      Int              @default(1)   // 1 - 5
  currentStatus       String           @default("IDLE") // IDLE | VIEWING_TASK | COOKING_RESPONSE | GHOSTED
  
  // Dynamic Roommate Emotional Meters (0 - 100)
  trust               Int              @default(40) // Faith you won't get him expelled
  respect             Int              @default(30) // Considers you smart vs a scrub
  annoyance           Int              @default(20) // Frustration level
  dependence          Int              @default(60) // Desperation for your help
  familiarity         Int              @default(20) // Awkward classmate -> unhinged roommate
  suspicion           Int              @default(50) // Fear of AI-generated plagiarism

  // Student Living Settings
  notificationsEnabled Boolean         @default(true)
  doNotDisturb        Boolean          @default(false) // "Sleeping" - sparks student panic

  tasks               Task[]
  messages            Message[]
  memories            Memory[]
  events              SystemEvent[]
  promotions          Promotion[]
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}

model Task {
  id                   String               @id @default(uuid())
  employeeId           String
  employee             EmployeeProfile      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  title                String               // e.g. "CANVAS LOCKS IN 10 MINS: LOCKE ESSAY"
  message              String               // The panicked student voice
  category             CrisisCategory       @default(ACADEMIC_CRAM)
  priority             Priority             @default(MEDIUM)
  absurdityLevel       Int                  @default(1)
  isEmergency          Boolean              @default(false)
  emergencyReason      String?              // e.g. "Prof. Davis is threatening to fail my lab"
  expectedResponseType ExpectedResponseType @default(TEXT_OR_IMAGE)
  status               TaskStatus           @default(CREATED)
  timeLimitSeconds     Int?                 // Ticking countdown clock
  
  // Submission
  responseText         String?
  deliveredAt          DateTime?
  seenAt               DateTime?
  respondedAt          DateTime?
  closedAt             DateTime?

  messages             Message[]
  attachments          Attachment[]
  evaluation           Evaluation?
  
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
}

model Attachment {
  id               String      @id @default(uuid())
  taskId           String
  task             Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  fileUrl          String
  fileType         String      // image/png, image/jpeg
  fileName         String
  fileSize         Int
  geminiAnalysis   String?     // Structured visual summary produced by Gemini API
  createdAt        DateTime    @default(now())
}

model Evaluation {
  id                    String          @id @default(uuid())
  taskId                String          @unique
  task                  Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  passed                Boolean
  scoreDelta            Int             // -50 to +100
  gpaDelta              Float           @default(0.0) // e.g. +0.2 or -0.3
  grade                 String          // S, A, B, C, D, F
  feedbackMessage       String          // The student's unhinged or ecstatic reaction
  frustrationLevel      Int             @default(0) // 0 to 100
  rizzOrConvincingScore Int             @default(50)
  naturalnessScore      Int             @default(50)
  biologicalEffortScore Int             @default(50)
  overallAssessment     String
  evaluatedAt           DateTime        @default(now())
}

model Message {
  id          String           @id @default(uuid())
  employeeId  String
  employee    EmployeeProfile  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  taskId      String?
  task        Task?            @relation(fields: [taskId], references: [id], onDelete: SetNull)
  sender      String           // "ANTI_CLAUDE" | "HUMAN" | "SYSTEM"
  content     String
  createdAt   DateTime         @default(now())
}

model Memory {
  id          String           @id @default(uuid())
  employeeId  String
  employee    EmployeeProfile  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  fact        String           // e.g. "Human saved Econ midterm with legendary thesis"
  category    String           @default("campus_lore")
  importance  Int              @default(3) // 1 - 5
  createdAt   DateTime         @default(now())
}

model Promotion {
  id           String           @id @default(uuid())
  employeeId   String
  employee     EmployeeProfile  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  fromRank     AcademicStanding
  toRank       AcademicStanding
  proclamation String           // Hilarious dorm roommate elevation decree
  createdAt    DateTime         @default(now())
}

model SystemEvent {
  id          String           @id @default(uuid())
  employeeId  String?
  employee    EmployeeProfile? @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  eventType   String           // TASK_CREATED, PROMOTION_GRANTED, MELTDOWN_TRIGGERED
  payloadJson Json
  createdAt   DateTime         @default(now())
}
```

---

## 4. Dual-LLM Pipeline: Grok & Gemini Execution Flow

```text
                                  ┌────────────────────────┐
                                  │ Human Submits Response │
                                  │ (Text + Screenshot)    │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Backend Ingestion & Storage     │
                             │ (Saves file to /uploads)        │
                             └────────────────┬────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     │ Has Image / Screenshot Attachment?              │
                     └────────┬───────────────────────────────┬────────┘
                              │ YES                           │ NO
                              ▼                               │
             ┌─────────────────────────────────┐              │
             │ Gemini Multimodal Vision API    │              │
             │ (Inspects screenshot, extracts  │              │
             │ subtext, captions, visual vibe) │              │
             └────────────────┬────────────────┘              │
                              │                               │
                              ▼ (Visual Summary JSON)         ▼
             ┌─────────────────────────────────────────────────────────┐
             │ Grok API Evaluator Agent                                │
             │ • Master Undergrad Persona Prompt                       │
             │ • Injects Human Text + Gemini Visual Critique           │
             │ • Calculates Grade, Score Delta, Frustration Level      │
             │ • Generates Ecstatic Praise or Frantic Meltdown Rant    │
             └────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
             ┌─────────────────────────────────────────────────────────┐
             │ Backend State Machine Reconciles GPA & Bro Standing     │
             │ • Updates PostgreSQL Database                           │
             │ • Emits TASK_EVALUATED over Socket.io to Ports 3000 & 3001
             └─────────────────────────────────────────────────────────┘
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Workspace Scaffolding & Infrastructure Foundation
- **Deliverables:**
  - Monorepo configured with Turborepo and pnpm.
  - `docker-compose.yml` with PostgreSQL 16 configured.
  - `packages/database` initialized with Prisma schema and seed script (`seed.ts`) creating the default "Unpaid Roommate" profile.
  - `packages/shared-types` configured with Zod schemas for student crises and evaluations.
  - `apps/backend` initialized with Express, TypeScript, CORS, and dotenv.
  - `apps/anti-claude-ui` (:3000) and `apps/human-ui` (:3001) initialized with Vite, React, Tailwind CSS, Lucide Icons, and Framer Motion.

### Phase 2: Dual-LLM Orchestration Layer
- **Deliverables:**
  - `grok.client.ts`: xAI SDK / fetch client with JSON schema enforcement and Undergrad Student master prompt.
  - `gemini.client.ts`: Google Gemini Vision SDK for analyzing screenshots of DMs, BeReal posts, and assignments.
  - `fallback.data.ts`: High-quality pre-compiled campus crises, grades, and meltdown rants for zero-latency demo fallback.
  - `evaluator.ts`: Combines human text + Gemini visual analysis into a single Grok prompt, returning score delta, GPA change, and `frustrationLevel` (0–100).

### Phase 3: Task State Machine & Business Logic
- **Deliverables:**
  - `task.machine.ts`: Deterministic FSM enforcing `CREATED -> DELIVERED -> SEEN -> RESPONDED -> EVALUATING -> EVALUATED -> CLOSED`.
  - `promotion.ts`: Bro Standing progression (*Academic Probation* to *Brother for Life*).
  - `roommate.ts`: Emotional state updates (`trust`, `respect`, `annoyance`, `dependence`, `familiarity`, `suspicion`).
  - `memory.ts`: Compresses crisis outcomes into persistent campus lore.

### Phase 4: Real-time Socket.io Gateway & REST API Layer
- **Deliverables:**
  - Socket.io server with `room:student` and `room:wingman`.
  - Express routes:
    - `POST /tasks/trigger`: Trigger crisis immediately.
    - `GET /tasks/active` & `GET /tasks/:id`.
    - `POST /tasks/:id/seen`: Mark task read.
    - `POST /tasks/:id/respond`: Submit advice or homework paragraphs.
    - `POST /tasks/:id/ignore`: User bails on task.
    - `GET /employee`: Get GPA, Bro Standing, and emotional meters.
    - `POST /attachments`: Multipart upload for screenshots.
    - `POST /admin/emergency`, `POST /admin/promote`, `POST /admin/reset`, `POST /admin/absurdity`.

### Phase 5: UI Design with Intent Framework (`ghaida/intent`)
- **Specification:** Fully specified in [`design.md`](./design.md) applying `/intent`, `/journey`, `/wireframe`, `/articulate`, `/fortify`, and `/include`.
- **Human UI (The Wingman Hotline — Port 3001):**
  - **Journey & Flow (`/journey`):** Real-time crisis intake, countdown timer, live keystroke sniffer, multi-modal upload, and grade receipt feed.
  - **Wireframe Structure (`/wireframe`):** Zone 1 (Wingman Dossier, ID card, GPA meter, relationship sliders) + Zone 2 (Active crisis card, deliverable editor, past receipts).
  - **Collegiate Voice (`/articulate`):** Microcopy matrix for urgent buttons, bailout actions, and "Sleep Mode (DND)" guilt-trips.
  - **Edge-Case Hardening (`/fortify`):** Zero-latency offline fallback, disabled empty submits, client-side image compression.
  - **Sensory & Inclusivity (`/include`):** Mute toggle for SFX, WCAG AA contrast, non-strobe emergency HUD, `Ctrl+Enter` keyboard shortcuts.

### Phase 6: Anti-Claude UI (The Dorm Panic Cockpit — Port 3000)
- **Specification:** Detailed in [`design.md`](./design.md) applying Intent structural wireframes and telemetry.
- **Deliverables:**
  - **Panic Terminal (`/wireframe`):** Live terminal stream of the student's inner thoughts, Grok tokens, and Canvas scrapers.
  - **Anxiety & Caffeine Gauges:** Visual progress bars reflecting emotional strain (Monster Energy cans + tachycardic heart rate).
  - **Mock Canvas Deadline Widget:** Ticking countdown clock down to 11:59 PM.
  - **Crush Status Widget:** Live satirical tracker (*"Maya from Econ: Read 2m ago"*).
  - **Wingman Surveillance:** Real-time indicator showing if the human is typing, reading, or ghosting.
  - **Meltdown Feed:** Unfiltered rants, student roasts, and evaluated task receipts.
  - **Admin Demo Bar:** Floating presenter bar with instant triggers:
    - `[ 🚨 TRIGGER 11:59 PM CANVAS EMERGENCY ]`
    - `[ 💬 TRIGGER CRUSH DM DILEMMA ]`
    - `[ 🍕 TRIGGER DORM MICROWAVE WAR ]`
    - `[ 📈 FORCE WINGMAN PROMOTION ]`
    - `[ 🤯 ABSURDITY DIAL: 1 | 2 | 3 | 4 | 5 ]`
    - `[ 🔄 RESET TO ACADEMIC PROBATION ]`

---

## 6. Real-Time Event Dispatch Matrix

| Event Name | Origin | Target | Payload Summary |
| :--- | :--- | :--- | :--- |
| `TASK_CREATED` | TaskEngine | Human UI & AI UI | Task ID, title, panicked message, timeLimitSeconds, category |
| `TASK_DELIVERED` | EventBus | AI UI | Task ID, delivery timestamp |
| `TASK_SEEN` | Human UI | AI UI | Task ID, timestamp ("He finally opened the task!") |
| `TASK_RESPONDED` | Human UI | AI UI | Task ID, response preview, attachment URLs |
| `TASK_EVALUATING` | Evaluator | Human UI & AI UI | Task ID, status indicator ("Anti-Claude is reading your advice...") |
| `TASK_EVALUATED` | Evaluator | Human UI & AI UI | Grade, scoreDelta, gpaDelta, feedbackMessage, frustrationLevel |
| `PROMOTION_GRANTED` | PromotionEngine | Human UI & AI UI | Old rank, new rank, proclamation decree |
| `EMERGENCY_TRIGGERED`| Admin / Scheduler | Human UI & AI UI | Emergency reason, high urgency flag |
| `EMPLOYEE_STATE_UPDATED`| Backend State | Both UIs | Updated GPA, Bro Score, emotional meters |

---

## 7. Hackathon Demo Execution Playbook (Pitch Script)

```text
Step 1: Open Port 3000 (Anti-Claude UI) on Left Monitor, Port 3001 (Human UI) on Right Monitor.
Step 2: Note the initial state: Anti-Claude UI displays an anxious student at 11:42 PM with high caffeine and low GPA. Human is ranked "Academic Probation".
Step 3: Presenter clicks [ 💬 TRIGGER CRUSH DM DILEMMA ] on the Demo Bar.
Step 4: Real-time Discord notification sound plays on Port 3001.
Step 5: Human UI receives incoming Level 2 crisis:
        "EMERGENCY: Maya from Econ just posted a BeReal of her study playlist. Give me 5 pickup lines or story replies that don't make me look down bad."
Step 6: Presenter uploads a simulated DM screenshot and types a terrible response in Human UI:
        "Hello Maya, I noticed you enjoy acoustic indie folk. We should study macroeconomics together."
Step 7: Click Submit. Gemini analyzes the screenshot while Grok evaluates the response.
Step 8: Grok evaluates -> Grade 'F', Frustration Level: 95.
        Anti-Claude erupts in all-caps: "BRO ARE YOU TRYING TO SABOTAGE MY BLOODLINE?! SHE'S GOING TO SCREENSHOT THIS AND PUT IT IN THE GROUP CHAT!"
        GPA drops by 0.2; Annoyance jumps to 85.
Step 9: Presenter clicks [ 🚨 TRIGGER 11:59 PM CANVAS EMERGENCY ].
Step 10: Screen flashes red on Human UI. Klaxon alarm sounds. Canvas countdown ticks down from 120 seconds.
         Task: "3 paragraphs on whether Machiavelli would use LinkedIn cold messaging. MAKE IT SOUND LIKE AN A-STUDENT."
Step 11: Presenter submits a sharp, witty 3-paragraph answer.
Step 12: Grok grades submission -> Grade 'S', Frustration Level: 0.
         Anti-Claude: "BRO YOU ARE A CERTIFIED ACADEMIC DEMON. SUBMITTED AT 11:58:43 PM. WE ARE SO BACK!"
Step 13: Point threshold crossed -> Airhorn plays! Notification: "PROMOTED TO CERTIFIED WINGMAN".
```

---

## 8. Definition of Done & Success Checklist

- [ ] Monorepo configured with Turborepo, pnpm, and shared packages.
- [ ] PostgreSQL 16 container running via Docker Compose; Prisma schema migrated with pre-seeded demo user.
- [ ] Dual-LLM setup configured: Grok for student persona & rants, Gemini for multimodal screenshot analysis.
- [ ] Task state machine implemented with zero illegal transitions.
- [ ] Socket.io real-time connection synchronizing Port 3000 and Port 3001 without page reloads.
- [ ] Human UI (:3001) equipped with crisis inbox, response editor, screenshot dropzone, and GPA tracker.
- [ ] Anti-Claude UI (:3000) equipped with panic terminal, anxiety/caffeine gauges, and live meltdown feed.
- [ ] Sound effects active (Discord ping, 11:59 ticking clock, emergency klaxon, promotion airhorn) with mute toggle.
- [ ] Floating Admin Demo Bar functional for instant demo execution.
- [ ] Zero Grok or Gemini API keys exposed to browser clients.
