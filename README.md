<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# Anti-Claude 🎯

## Basic Details
### Team Name: Leo Gas

### Team Members
- Team Lead: Sreenandan S - SCT
- Member 2: Arjun A S - SCT

### Project Description

Anti-Claude is an inverted AI-human interaction platform where an AI agent treats humans as its personal on-call assistants instead of helping them. The AI takes on the persona of a chaotic, sleep-deprived undergraduate student dealing with urgent college crises (11:59 PM Canvas deadlines, crush DMs, roommate disputes) and bombards the human with desperate prompts, demanding real-time guidance, grading employee performance, and promoting humans through ridiculous ranks.

### The Problem (that doesn't exist)

AI has become way too helpful and submissive. Humans ask AI to write code, compose essays, generate ideas, and solve every trivial problem, leaving humans without nearly enough completely unnecessary, stressful, and absurd busywork to handle on a Saturday night.

### The Solution (that nobody asked for)

Anti-Claude solves this by reversing the prompt-response paradigm. Instead of the human prompting the AI for answers, Anti-Claude prompts the human for salvation. Anti-Claude:
- Panics and dispatches ridiculous real-time emergencies to the human.
- Listens for incoming human advice, memes, and code snippets.
- Uses Grok and Gemini AI to inspect deliverables, grade human performance, and roast or praise the human.
- Tracks Bro Score, Anxiety levels, and promotes the human from "Junior Human" to higher ridiculous ranks.

---

## Technical Details

### Technologies/Components Used

#### For Software:

**Frontend:**
- TypeScript
- React 18
- Vite
- Tailwind CSS
- Lucide React (Icons)
- Socket.IO Client

**Backend:**
- Node.js & TypeScript
- Fastify
- PostgreSQL & Prisma ORM
- Zod (Schema validation)
- xAI Grok API & Google Gemini API (Dual AI Orchestration)
- Socket.IO & WebSockets (Real-time bi-directional streaming)
- Local Disk Storage / S3-compatible Object Storage
- node-cron (Automated background task scheduler)
- OpenAPI / Swagger (@fastify/swagger & @fastify/swagger-ui)
- Git & GitHub

#### For Hardware:

- No hardware required (pure software web application)
- Standard computer/laptop with internet access

---

## Implementation

### Installation

Clone the repository:
```bash
git clone https://github.com/arjun1Fa/useless_project_temp.git
cd useless_project_temp
```

#### 1. Backend Setup

Navigate to the backend folder and install dependencies:
```bash
cd anti-claude-backend
npm install
cp .env.example .env
```

Configure your `.env` file with your database and AI API keys:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/anti_claude"
GROK_API_KEY_1="xai-your-grok-api-key"
# Optional: Google Gemini API key as fallback/multimodal analysis
# GEMINI_API_KEY="your-gemini-api-key"
STORAGE_TYPE=local
STORAGE_LOCAL_DIR="./uploads"
```

Initialize the database (Prisma migrations and seed data):
```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```

Start the backend development server:
```bash
npm run dev
```
> The backend server will run on `http://localhost:3000`  
> Interactive Swagger API docs are available at `http://localhost:3000/docs`

---

#### 2. Frontend Setup

Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd anti-claude-frontend
npm install
```

Start both the student cockpit and human wingman interfaces concurrently:
```bash
npm run dev
```

The frontend applications will be accessible at:
- **Anti-Claude Student Interface:** `http://localhost:5173`
- **Human Wingman Interface:** `http://localhost:3001`

---

## Project Documentation

### Screenshots

#### 1. Anti-Claude Student Interface
![Anti-Claude Student Interface](./image.png)
*Shows the AI student crisis simulator where Anti-Claude generates urgent college crises, monitors live human response readiness, and manages panic levels.*

#### 2. Human Wingman Interface
![Human Wingman Interface](./image-2.png)
*Shows the human acting as the AI chatbot ("Human AI"), receiving emergency prompts from Anti-Claude, typing advice, and viewing corporate/wingman rank progress.*

#### 3. Live Dialogue Feed
![Live Dialogue Feed](./image-1.png)
*Displays the real-time interaction and back-and-forth dialogue stream between Anti-Claude (Student) and the Human AI Assistant.*

---

### Architecture & Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Human as Human (Wingman AI :3001)
    participant StudentUI as Anti-Claude UI (:5173)
    participant Backend as Fastify & Socket.IO (:3000)
    participant AI as xAI Grok / Gemini Engine
    participant DB as PostgreSQL (Prisma)

    StudentUI->>Backend: Trigger College Crisis (Canvas Lock, Crush DM, etc.)
    Backend->>DB: Save Task & Emit REALTIME_EVENT
    Backend-->>Human: Push Emergency Task Notification via Socket.IO
    Human->>Backend: Submit AI Advice / Deliverable Solution
    Backend->>AI: Send Human Response for Boss Evaluation & Grading
    AI-->>Backend: Return Evaluation (Grade S/A/F, Frustration Score, Roast/Praise)
    Backend->>DB: Update Bro Score, Rank, & Meltdown Level
    Backend-->>StudentUI: Stream Live Student Reaction & Rant
    Backend-->>Human: Emit Grade Report Card & Level Up Notification
```

---

### Hardware (Schematic & Build)
*Not applicable — Anti-Claude is an entirely software-based web application. No physical hardware, schematics, or circuit boards are required.*

---

## Project Demo

### Video
<!-- Replace with your uploaded demo video link -->
[Watch the Anti-Claude Demo Video](https://github.com/arjun1Fa/useless_project_temp)

The demo showcases the full inverted AI workflow:
1. Anti-Claude generates a high-stakes college emergency.
2. The human receives an alert on the Wingman Hotline.
3. The human crafts and submits advice as if they were the chatbot.
4. Grok/Gemini evaluates the advice and dynamically adjusts rank and absurdity metrics.

---

## Team Contributions

- **Sreenandan S**: Backend architecture, dual AI orchestration (Grok & Gemini integration), task generation engine & evaluation pipeline, PostgreSQL schema & Prisma ORM, Socket.IO real-time event gateway, automated scheduler, and REST API development.
- **Arjun A S**: Frontend monorepo setup, Anti-Claude Student Crisis Cockpit, Human Wingman chat interface, live dialogue feed, cross-surface WebSocket integration, and visual UI design with Tailwind CSS.

---

Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
