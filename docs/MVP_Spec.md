# GoMaths MVP Specification

**Version:** 0.1 (Draft)
**Status:** Pre-development scoping
**Owner:** TBD (Product Lead)
**Target launch:** Pilot in 4 schools, end of Month 4

---

## 1. Purpose of This Document

This document defines the **smallest shippable version** of GoMaths that can validate the core hypothesis:

> South African learners using GoMaths daily for one term show measurable improvement in CAPS-aligned mathematics assessments compared to a control group.

If this hypothesis fails, no amount of RPG, multilingual, or 3D-graphing features will save the product. If it succeeds, every later phase is justified.

This is **not** a vision document (see `Preamble.md`) or an architecture document (see `Development_Strategy.md`). This is a build contract.

---

## 2. In Scope (MVP — Phase 1)

The MVP ships **five features**. Nothing else.

### 2.1 Authentication & Profile
- Email + password sign-up (no social login yet)
- Single role: **Student** (parent/teacher accounts deferred to Phase 2)
- Grade selection on first launch
- POPIA-compliant consent flow for under-18 users (parental email)

### 2.2 CAPS Curriculum — Narrow Slice
- **One grade band only for the pilot: Grade 9 (Senior Phase) OR Grade 12 Matric prep.** Pick one before development starts.
- Recommended: **Grade 9**, because (a) it's a transition year where intervention has highest impact, (b) content volume is tractable, (c) parents are highly motivated.
- Topics covered = the official CAPS Grade 9 topic list (≈ 12 topics).
- Per topic: 1 lesson page + 10–15 practice questions + worked solutions.

### 2.3 AI Tutor (text chat)
- English only
- GPT-4-class model behind FastAPI service
- System prompt enforces: CAPS curriculum context, age-appropriate tone, no off-topic answers
- **Hard requirement:** every numeric/algebraic answer the tutor produces is re-validated by SymPy before being shown to the learner. If validation fails, the tutor falls back to a "let me think again" path or surfaces the worked solution from the curriculum.
- Conversation history persisted per student

### 2.4 Scan Solver (printed equations only)
- Camera capture → MathPix OCR → LaTeX → SymPy solver → step-by-step rendering (KaTeX)
- Handwriting recognition: **out of scope for MVP** (flag clearly in UX: "works best with typed/printed equations")
- Topics supported: linear equations, quadratic equations, basic algebra simplification, arithmetic
- Solver rejects (gracefully) anything it can't parse — does NOT guess

### 2.5 Basic Progress Tracking
- Per-student dashboard: topics attempted, % correct, last 7 days activity
- Server-side event log of every question answered
- No parent/teacher view yet

---

## 3. Out of Scope (Explicitly Deferred)

These appear in the strategy doc but are **not** built in MVP:

| Feature | Deferred to |
|---|---|
| Adaptive learning / recommendation engine | Phase 2 |
| Parent dashboard | Phase 2 |
| Teacher dashboard | Phase 2 |
| Gamification (XP, badges, streaks) | Phase 2 |
| Multilingual (Afrikaans, isiZulu, Sesotho, Xhosa) | Phase 2 |
| Voice tutor | Phase 3 |
| Handwriting OCR | Phase 3 |
| Graphing engine (Desmos-style) | Phase 3 |
| Offline-first sync | Phase 3 (but **data model must support it from day 1**) |
| RPG / multiplayer / 3D STEM | Phase 4 |
| WhatsApp integration | Phase 2 |
| School / B2B portal | Phase 2 |
| Payments / subscriptions | Phase 2 (MVP is free for pilot schools) |

---

## 4. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Mobile platforms | Android 8+ (priority), iOS 14+ |
| Target device | Entry-level Android (2GB RAM, e.g. Samsung A-series) |
| App size | < 60 MB initial download |
| Cold-start time | < 3 seconds on target device |
| Network | Works on 3G; degrades gracefully offline (cached lessons readable) |
| Data residency | All PII in AWS af-south-1 (Cape Town) — POPIA requirement |
| AI response latency | Tutor: < 5s p50, < 12s p95. Solver: < 8s p95. |
| Accessibility | Dynamic text size, screen-reader labels on all interactive elements |

---

## 5. Success Metrics (Pilot — 12 weeks)

### Technical
- Crash-free session rate ≥ 99%
- Solver accuracy on supported topics ≥ 92% (manually graded sample of 500 solves)
- Tutor factual accuracy ≥ 95% (manually graded sample of 300 conversations)

### Engagement
- DAU/MAU ≥ 35% in pilot cohort
- ≥ 60% of registered students complete ≥ 5 practice sessions
- Median session length ≥ 8 minutes

### Educational (the real test)
- Pilot students show **≥ 8 percentage point** improvement on a standardised CAPS Grade 9 assessment vs. a matched control group, measured pre/post 12-week pilot.

If the educational metric fails, **do not proceed to Phase 2** until the learning loop is fixed.

---

## 6. Team & Timeline

| Role | Count | Notes |
|---|---|---|
| Product Manager | 1 | Owns scope discipline |
| UI/UX Designer | 1 | Mobile-first, low-end device aware |
| React Native Engineer | 2 | One senior, one mid |
| Backend Engineer (NestJS) | 1 | |
| AI Engineer (Python/FastAPI) | 1 | Owns solver + tutor + SymPy validation |
| QA Engineer | 1 | Part-time acceptable until Month 3 |
| Curriculum Specialist | 2 | SACE-registered, Grade 9 maths experience |
| DevOps (fractional) | 0.5 | Sets up AWS af-south-1, CI/CD |

**Timeline (16 weeks):**
- Weeks 1–2: Detailed design, content plan locked, infra scaffolded
- Weeks 3–10: Build (parallel: app, backend, AI services, curriculum content)
- Weeks 11–12: Internal QA, content review, accessibility audit
- Weeks 13–14: Closed beta with 1 school (~30 students)
- Weeks 15–16: Fix critical issues, expand to 4-school pilot
- Month 5+ : Pilot runs for 12 weeks; measure outcomes

---

## 7. Budget Envelope (Indicative, ZAR)

| Line item | Low | High |
|---|---|---|
| Engineering (16 weeks, 5.5 FTE) | R 1.4M | R 2.2M |
| Curriculum content (2 specialists, 16 weeks) | R 280K | R 420K |
| Design (1 FTE, 16 weeks) | R 200K | R 320K |
| AI API costs (pilot scale) | R 40K | R 80K |
| MathPix OCR | R 30K | R 60K |
| Cloud infra (AWS af-south-1, pilot scale) | R 50K | R 100K |
| Legal (POPIA, contracts) | R 60K | R 120K |
| Contingency (15%) | R 310K | R 500K |
| **Total** | **~R 2.4M** | **~R 3.8M** |

USD-equivalent original brief ($30k–$120k) is unrealistic for a senior SA-based team. Budget for the higher end.

---

## 8. Key Risks (MVP-Specific)

| Risk | Mitigation |
|---|---|
| AI tutor produces wrong maths | SymPy validation layer + curriculum-grounded prompts + human spot-check of every conversation in first 4 weeks |
| MathPix accuracy poor on SA textbook fonts | Test against actual CAPS textbooks in Week 1; have manual entry fallback ready |
| Curriculum content slips schedule | Hire curriculum specialists in Week 0, before engineering starts |
| Pilot school dropout | Sign MOUs with 6 schools to land 4 |
| Educational metric fails | Build instrumentation to diagnose *why* (lesson quality? engagement? difficulty calibration?) |

---

## 9. Decisions Required Before Kickoff

1. **Grade band:** Grade 9 vs. Matric prep. (Recommendation: Grade 9.)
2. **Pilot schools:** identify and sign MOUs.
3. **Curriculum content format:** in-house authoring vs. licensing existing CAPS-aligned content. (Recommendation: hybrid — license question banks, author lessons in-house.)
4. **AI provider:** OpenAI vs. Anthropic vs. both behind an abstraction. (Recommendation: abstraction from day 1; default to whichever has best maths benchmarks at build time.)
5. **Hosting region confirmation:** AWS af-south-1 vs. eu-west-1 with SA edge. (Recommendation: af-south-1 for POPIA defensibility.)

---

## 10. Definition of Done (MVP)

The MVP is "done" when:
- All 5 features ship to production with the non-functional requirements met
- 4 pilot schools onboarded with signed agreements
- Pre-assessment administered to pilot + control cohorts
- Monitoring + error reporting live (Sentry, CloudWatch)
- Incident response runbook exists
- POPIA Data Protection Impact Assessment signed off

Anything beyond this list is Phase 2.
