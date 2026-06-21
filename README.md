# SkillForge AI

## Overview
SkillForge AI is an autonomous career intelligence platform powered by a 7-agent AI system. It diagnoses skill gaps, builds personalized learning plans, runs adaptive practice sessions, certifies mastery, and provides career simulation, digital twin modeling, and full decision explainability.

## Architecture
- **Monorepo** with npm workspaces: `client/` and `server/`
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + Recharts (port 5000 dev)
- **Backend**: Express.js REST API (port 3001 dev)
- **LLM Integration**: Gemini 2.0 Flash (primary) + Groq llama-3.3-70b (fallback) + rule-based engine (no-key mode)
- **Production**: Express serves both API routes and built React static assets (`client/dist/`)

## 🌟 Features

- **Goal-Based Learning**: Enter your learning goal and get a personalized skill tree
- **Adaptive Diagnostics**: AI-powered diagnostic questions to assess your current level
- **Dynamic Learning Plans**: Personalized day-by-day learning plans that adapt to your progress
- **Hybrid Content Generation**:
  - Uses static knowledge base for common topics
  - Falls back to LLM generation for custom/advanced topics
  - Seamless integration between static and dynamic content
- **Real-time Adaptation**: Learning plan adjusts based on your performance
- **Progress Tracking**: Visual dashboards showing your skill mastery and progress
- **Comprehensive Reports**: Detailed performance reports with AI-generated insights


## 🎯 How It Works

1. **Goal Input**: User enters a learning goal (e.g., "Learn React for web development")

2. **Skill Decomposition**:
   - Static analyzer identifies domain and core skills
   - LLM enhances with custom skills (if enabled)

3. **Diagnostic Assessment**:
   - Generates questions from static knowledge base
   - LLM creates personalized questions for custom skills
   - Evaluates user's current proficiency

4. **Learning Plan Creation**:
   - Builds day-by-day plan based on diagnostic results
   - Prioritizes weak areas
   - Includes review sessions

5. **Adaptive Learning**:
   - User completes daily challenges
   - System evaluates performance
   - Plan adapts based on progress

6. **Progress Tracking**:
   - Visual skill tree shows mastery levels
   - Performance charts track improvement
   - Comprehensive reports provide insights
 - 
## Project Structure
```
/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   │   ├── Landing.jsx        # Hero + social proof stats + agent demo + vs-ChatGPT + pricing teaser + footer
│   │   │   ├── Pricing.jsx        # Full SaaS pricing page (monthly/annual toggle, 3 tiers, FAQ)
│   │   │   ├── Dashboard.jsx      # 6-tab dashboard + confidence heatmap + API key banner
│   │   │   ├── DemoMode.jsx       # Live 7-agent SSE demo ("Mission Control" cinematic layout)
│   │   │   ├── SimulationLab.jsx  # What-if career simulator (responsive input row)
│   │   │   ├── CareerTwin.jsx     # Career digital twin + radar chart (responsive stats row)
│   │   │   ├── ExplainabilityConsole.jsx # Agent debate + reasoning chain
│   │   │   ├── Session.jsx        # Learning session flow (7 phases)
│   │   │   ├── Report.jsx         # Competency report with print
│   │   │   ├── Profiling.jsx      # User profiling questionnaire
│   │   │   └── Diagnostic.jsx     # Skill diagnostic MCQ
│   │   ├── components/   # Shared UI components
│   │   │   ├── Navbar.jsx              # Nav + API status badge + mobile hamburger
│   │   │   ├── ConfidenceHeatmap.jsx   # Calibration heatmap visualization
│   │   │   ├── APIKeyBanner.jsx        # Dismissible API key setup banner
│   │   │   ├── AgentBrain.jsx          # Decision log visualizer
│   │   │   ├── SkillDigitalTwin.jsx    # Radar chart component
│   │   │   ├── PredictiveMasteryForecast.jsx
│   │   │   ├── AgentThinking.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   └── utils/        # api.js with 60s timeout request helper
│   ├── index.html        # Meta tags, OG tags, viewport, fonts, FOUC prevention
│   └── vite.config.js    # Vite config (port 5000, proxy /api -> localhost:3001)
├── server/               # Express.js backend
│   ├── routes/           # API routes (goal, diagnostic, session, report, simulation, market, demo, health)
│   ├── services/         # GeminiService LLM singleton
│   ├── llm/              # LLMClient + ResponseParser
│   ├── agent/            # SmartAgent, MarketAgent, SimulationAgent, AgentDebate, Evaluator, PlanBuilder
│   ├── config/           # loadEnv.js
│   ├── knowledge/        # Static JSON data (domains, questions, challenges)
│   ├── data/             # Runtime data and demo fixtures
│   └── index.js          # Express entry (port 3001; serves client/dist statically in production)
├── package.json          # Root workspace config
└── .env.example          # Environment variable template
```

## Workflows (Development)
- **Start application**: `npm run dev --workspace=client` (frontend on port 5000, webview)
- **Start Backend**: `npm run dev --workspace=server` (API on port 3001, console)

## Environment Variables
See `.env.example` for required variables:
- `GEMINI_API_KEY` — Google Gemini API key (https://aistudio.google.com/app/apikey)
- `GEMINI_MODEL` — Model name (default: `gemini-2.0-flash`)
- `GROQ_API_KEY` — Groq API key for fallback LLM (optional, free at https://console.groq.com)
- `PORT` — Server port (default: 3001)
- `NODE_ENV` — Set to `production` in deployment

## LLM Behavior
- When `GEMINI_API_KEY` is set and valid, Gemini 2.0 Flash is used for all AI features
- When not set, app falls back to a rule-based system (no LLM calls)
- Groq is used as a fallback when Gemini quota is exceeded
- Navbar shows live API status: "Gemini ON" / "Groq ON" / "Rule-based"

## Key Pages & Routes
- `/` — Landing: hero + 4-stat social proof row + goal input + agent demo terminal + vs-ChatGPT table + pricing teaser + footer
- `/pricing` — SaaS pricing: Starter (free) / Pro ($19/mo) / Enterprise (custom) + metrics + vs-ChatGPT table + FAQ
- `/profiling` — User profiling (4-question form)
- `/diagnostic` — Skill diagnostic assessment (5 MCQ)
- `/dashboard` — 6-tab dashboard: overview, plan, skills, performance (confidence heatmap), agent brain, history
- `/session/:day` — Practice session flow (confidence → learn → warmup → challenge → evaluate → result → journal)
- `/report` — Competency report with print support
- `/simulation` — What-if career scenario simulator (SimulationAgent + path comparison)
- `/career-twin` — Career digital twin with radar chart, forecast, market intelligence
- `/explain` — Explainability console: full agent decision log + debate visualizer
- `/demo` — Live 7-agent SSE orchestration demo ("Mission Control" layout)

## API Endpoints
- `GET /api/health` — Server health + LLM status
- `POST /api/goal` — Goal analysis + profile + plan
- `POST /api/diagnostic/questions` — Generate MCQ questions
- `POST /api/diagnostic/submit` — Submit answers, get scores
- `GET /api/session/dashboard/:userId` — Full dashboard data
- `POST /api/session/:day/start` — Start a learning session
- `POST /api/session/:day/submit` — Submit session answers
- `GET /api/demo/run` — SSE stream of 7-agent pipeline demo
- `POST /api/simulation/whatif` — What-if career path simulation
- `POST /api/simulation/compare` — Side-by-side path comparison
- `GET /api/simulation/forecast/:userId` — Career trajectory forecast
- `GET /api/market/intelligence/:userId` — Market intelligence
- `POST /api/report/generate` — Generate competency report

## Responsive Design
All pages are responsive for mobile, tablet, and desktop:
- Navbar: desktop nav hidden on mobile, hamburger menu shown
- Landing: 2-col grid stacks on mobile; flow steps 2-col on mobile; comparison table scrolls horizontally
- DemoMode: goal cards 2-col on mobile → 3-col tablet → 5-col desktop; two-column live layout stacks below lg
- Pricing: cards stack to 1-col on mobile; comparison table scrolls horizontally; hero h1 scales down
- SimulationLab: input+button stacks vertically on mobile
- CareerTwin: stats row wraps on mobile
- Dashboard: tab bar scrolls horizontally on mobile; tab labels hidden on small screens

## Deployment
- **Target**: autoscale
- **Build command**: `npm run build --workspace=client` (outputs to `client/dist/`)
- **Run command**: `node server/index.js`
- In production (`NODE_ENV=production`), Express serves `client/dist/` statically with SPA fallback (`*` → `index.html`)
- Deployment configured in `.replit` `[deployment]` section
