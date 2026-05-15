> **Note:** This document is the original product-vision Preamble that
> shaped GoMaths v1 and continues to shape the v2 rebuild. Treat it as
> historical + directional context — it's aspirational and pre-dates
> the v2 architectural decisions in `docs/Architecture_Decisions.md`.
> Specific scope, phasing, and budget numbers in here have been
> superseded by `docs/Phase1_Launch_Plan.md` for v2.

---

Building "GoMaths" into a single unified platform is a very large-scale EdTech + AI project. What you're describing combines the core functionality of multiple world-class platforms:

- [Photomath](https://photomath.com?utm_source=chatgpt.com)
- [Prodigy Math](https://www.prodigygame.com?utm_source=chatgpt.com)
- [IXL](https://www.ixl.com?utm_source=chatgpt.com)
- [Brilliant](https://brilliant.org?utm_source=chatgpt.com)
- [Desmos](https://www.desmos.com?utm_source=chatgpt.com)
- [DreamBox](https://www.dreambox.com?utm_source=chatgpt.com)

This is absolutely achievable, but it requires careful architecture, phased development, and a strong long-term roadmap.

# What GoMaths Would Actually Become

GoMaths would evolve into:

- A mobile-first AI Math Learning Platform
- A South African curriculum-aligned EdTech ecosystem
- An AI tutor + RPG game + assessment engine + graphing calculator + analytics platform
- A B2C + B2B product for:
  - Students
  - Parents
  - Schools
  - Tutors
  - Education departments

You are essentially building a “Math Super App”.

---

# Core Systems Required

## 1. AI Camera Solver (Photomath-style)

### Features

- Scan handwritten or printed equations
- OCR for mathematics
- Step-by-step solutions
- AI explanation engine
- Multiple solving methods
- Voice explanation
- Real-time camera recognition

### Technology Stack

- OCR Engine:
  - Google ML Kit
  - MathPix API
  - Custom LaTeX OCR models

- AI Solver:
  - OpenAI reasoning models
  - Wolfram-style symbolic engine
  - SymPy

- Equation Rendering:
  - MathJax
  - KaTeX

### Difficulty

Very high.

Math OCR alone is a major engineering challenge.

---

## 2. RPG Game-Based Learning (Prodigy-style)

### Features

- Character creation
- Quests
- Battle system using math
- XP and leveling
- Rewards and achievements
- Multiplayer classrooms
- Parent dashboards

### Required Team

- Game designers
- Unity developers
- Animators
- Sound designers
- Education specialists

### Best Technology

- Unity Engine
- Godot (budget-friendly alternative)
- Firebase multiplayer backend

### Complexity

This alone can become a standalone company.

---

# 3. South African Curriculum Engine

This is critical because localization becomes your competitive advantage.

## You Need

- CAPS curriculum mapping
- Grade-by-grade topic trees
- Difficulty levels
- Assessment database
- Learning outcomes

### Subjects

- Foundation phase maths
- Intermediate maths
- Senior phase
- FET phase
- Matric prep

### Important

You need actual South African maths educators involved from day one.

---

# 4. Adaptive Learning AI (DreamBox-style)

This is the “brain” of the platform.

## Features

- Detect weak areas
- Recommend lessons
- Predict failure risks
- Personalized difficulty adjustment
- Learning speed optimization

### Technologies

- AI recommendation systems
- Learning analytics
- Student behavior tracking
- Knowledge graphs

### Complexity

Very high.

This requires:

- Data scientists
- AI engineers
- Educational psychologists

---

# 5. Graphing + Visualization Engine (Desmos-style)

### Features

- Interactive graphing
- Geometry visualization
- Algebra animations
- Function transformations
- Calculus visualizations

### Technologies

- Desmos API alternatives
- WebGL
- D3.js
- Three.js

### Important

Visual learning is one of the strongest engagement tools.

Example:

genui{"math_block_widget_always_prefetch_v2":{"content":"y=x^2-4x+3"}}

Students can visually understand transformations instead of memorizing formulas.

---

# 6. STEM Interactive Challenges (Brilliant-style)

### Features

- Visual problem solving
- Interactive simulations
- Logic puzzles
- Drag-and-drop equations
- Science + math integration

### Technologies

- React Native animations
- Three.js
- Interactive canvas systems

---

# 7. AI Tutor System

This becomes the emotional center of the app.

## Features

- Chat-based tutoring
- Voice tutoring
- Explain concepts differently
- Multilingual support
- Personalized encouragement
- Homework help

### South African Advantage

Support:

- English
- Afrikaans
- isiZulu
- Sesotho
- Xhosa

This can become a major differentiator.

---

# Suggested Architecture

## Mobile App

- React Native (recommended)
  OR
- Flutter

## Backend

- Node.js / NestJS
- Python AI microservices

## Database

- PostgreSQL
- Redis
- Vector DB for AI memory

## Cloud

- AWS
  OR
- Google Cloud

## AI Infrastructure

- OpenAI APIs
- Custom fine-tuned models
- OCR AI services

---

# Recommended Development Phases

## PHASE 1 — MVP (3–6 Months)

Focus ONLY on:

- User accounts
- Grade selection
- Curriculum lessons
- AI tutor chat
- Equation scanner
- Basic analytics

### Team

- 1 UI/UX Designer
- 2 Mobile developers
- 1 Backend developer
- 1 AI engineer
- 1 Curriculum specialist

### Estimated Cost

$30,000–$120,000+

---

# PHASE 2 — Smart Learning Platform (6–12 Months)

Add:

- Adaptive learning
- Progress tracking
- Parent dashboards
- Teacher dashboards
- Gamification
- Quizzes

### Estimated Cost

$100,000–$350,000+

---

# PHASE 3 — RPG World + STEM Engine (12–24 Months)

Add:

- Full RPG gameplay
- Multiplayer
- Advanced visual simulations
- 3D learning
- AI-generated challenges

### Estimated Cost

$300,000–$1M+

---

# Biggest Challenges

## 1. Content Creation

This is actually harder than coding.

You need:

- Thousands of lessons
- Thousands of exercises
- Step-by-step solutions
- Curriculum mapping

---

## 2. AI Accuracy

Math AI must be extremely reliable.

Parents lose trust quickly if:

- Solutions are wrong
- Steps are inconsistent

---

## 3. Engagement

Kids abandon boring apps quickly.

Game psychology matters heavily.

---

## 4. Infrastructure Costs

AI + OCR + graphics + multiplayer can become expensive fast.

---

# Smart Strategy Recommendation

Do NOT try to build everything at once.

## Best Strategy

Start with:

### Version 1

- AI Solver
- South African curriculum
- AI Tutor
- Progress analytics

### Version 2

- Gamification
- Rewards
- Challenges

### Version 3

- Full RPG ecosystem

This is how most successful EdTech companies evolved.

---

# Massive Opportunity for GoMaths

A localized African-first AI math learning platform has huge potential.

Most global apps are:

- US-centric
- Expensive
- Not aligned to African curricula

GoMaths can dominate:

- South Africa
- Nigeria
- Kenya
- Ghana
- Namibia
- Botswana

especially if:

- Mobile data optimization is strong
- Offline learning exists
- Pricing is affordable

---

# Recommended Features That Could Make GoMaths Stand Out

## AI Teacher Assistant

- Generates worksheets
- Marks assignments
- Creates tests automatically

## Parent Intelligence Dashboard

- Child strengths/weaknesses
- Study recommendations
- Performance predictions

## Offline Learning

Huge advantage in Africa.

## WhatsApp Integration

Extremely powerful in African markets.

## Voice-Based Explanations

Important for younger learners.

---

# Ideal Tech Stack Summary

| Area        | Recommended            |
| ----------- | ---------------------- |
| Mobile App  | React Native           |
| Backend     | NestJS + Python        |
| AI          | OpenAI + custom models |
| OCR         | MathPix + ML Kit       |
| Game Engine | Unity                  |
| Database    | PostgreSQL             |
| Analytics   | BigQuery               |
| Hosting     | AWS/GCP                |
| Real-time   | Firebase               |

---

# Realistic Team Needed

## Core Team

- Product Manager
- EdTech Specialist
- Math Curriculum Experts
- Mobile Developers
- Backend Developers
- AI Engineers
- Game Developers
- UI/UX Designers
- QA Engineers
- DevOps Engineer

---

# Final Reality Check

What you described is not just “an app”.

It is:

- an AI platform,
- a gaming platform,
- a curriculum platform,
- an analytics platform,
- and an educational ecosystem.

This is venture-scale software.

The smartest path is:

1. Build a powerful MVP
2. Validate with South African schools
3. Improve learning outcomes
4. Scale gradually into the larger vision

GoMaths already has a strong niche opportunity because localized African education technology is still massively underserved.
