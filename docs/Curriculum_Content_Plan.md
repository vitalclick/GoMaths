# GoMaths Curriculum Content Plan

**Version:** 0.1 (Draft)
**Scope:** MVP content for Grade 9 (Senior Phase) CAPS Mathematics
**Owner:** TBD (Head of Curriculum)

---

## 1. Why This Plan Exists

Code is not the critical path for GoMaths. **Content is.**

A working app with weak lessons fails. A weak app with strong lessons can be rescued. This plan defines who writes the lessons, what they look like, how they are reviewed, and how they are loaded into the platform — for the MVP and beyond.

---

## 2. MVP Content Scope (Grade 9)

The CAPS Grade 9 Mathematics curriculum is organised into 5 content areas. The MVP covers **all of them at a minimum viable depth**.

| # | Content area | Topics (approx.) | Lessons | Practice Qs |
|---|---|---|---|---|
| 1 | Numbers, Operations & Relationships | 4 | 4 | 60 |
| 2 | Patterns, Functions & Algebra | 5 | 5 | 75 |
| 3 | Space & Shape (Geometry) | 4 | 4 | 60 |
| 4 | Measurement | 3 | 3 | 45 |
| 5 | Data Handling & Probability | 3 | 3 | 45 |
| | **Total** | **~19** | **~19** | **~285** |

Each topic produces:
- **1 lesson page** (explanation + 2–3 worked examples)
- **15 practice questions** at three difficulty tiers (5 easy / 7 medium / 3 hard)
- **Full worked solution** for every practice question
- **Common-mistake annotations** for 3–5 of the questions per topic

---

## 3. Content Asset Specification

Every lesson is authored as structured Markdown + JSON metadata. This is what engineering loads.

### 3.1 Lesson file format

```
curriculum-data/
└── grade-9/
    └── algebra/
        └── solving-linear-equations/
            ├── lesson.md          # explanation + worked examples
            ├── questions.json     # practice question bank
            └── metadata.json      # topic ID, prerequisites, CAPS code
```

### 3.2 `metadata.json` schema

```json
{
  "topic_id": "g9.alg.linear-eq",
  "title": "Solving Linear Equations",
  "grade": 9,
  "content_area": "Patterns, Functions & Algebra",
  "caps_reference": "Term 2, Topic 2.3",
  "prerequisites": ["g9.alg.expressions"],
  "learning_outcomes": [
    "Solve linear equations of the form ax + b = c",
    "Solve linear equations with variables on both sides",
    "Apply linear equations to word problems"
  ],
  "estimated_minutes": 25
}
```

### 3.3 `questions.json` schema

```json
{
  "questions": [
    {
      "id": "g9.alg.linear-eq.q001",
      "difficulty": "easy",
      "stem": "Solve for x: 2x + 5 = 13",
      "answer": "x = 4",
      "answer_latex": "x = 4",
      "solution_steps": [
        "Subtract 5 from both sides: 2x = 8",
        "Divide both sides by 2: x = 4"
      ],
      "common_mistakes": [
        "Forgetting to apply the operation to both sides",
        "Sign errors when moving terms"
      ],
      "tags": ["linear", "one-variable"]
    }
  ]
}
```

### 3.4 Quality bar (every asset)
- Mathematically verified by a second curriculum specialist (4-eye rule)
- Solution steps re-checked by SymPy where computable
- Language: clear, Grade 9 reading level, neutral South African English
- Examples use SA-relevant contexts (rand, local place names, real-world scenarios)
- No copyrighted material from published textbooks (write original or use openly licensed sources)

---

## 4. Team & Workflow

### 4.1 People
- **2 Curriculum Specialists** (SACE-registered, Grade 9+ Mathematics teaching experience, ≥ 5 years)
- **1 Mathematics Editor** (part-time, weeks 6–14) — final quality pass
- **1 Curriculum Lead** (the PM or a senior teacher) — owns delivery

### 4.2 Authoring workflow

```
Specialist A writes lesson + Qs
         ↓
Specialist B peer reviews (mathematical correctness, clarity)
         ↓
SymPy validation pass (engineering tooling, automated)
         ↓
Editor final pass (language, consistency, formatting)
         ↓
Curriculum Lead sign-off
         ↓
Merged to main branch → loaded into platform
```

Each lesson is one PR. Reviewed like code.

### 4.3 Throughput target
- Sustainable rate per specialist: **2 lessons/week** (incl. 15 Qs + solutions)
- 2 specialists × 2 lessons/week × 12 weeks = **48 lessons** capacity
- MVP needs **~19** → buffer for revisions, illustrations, and edge cases

---

## 5. Schedule (aligned to MVP 16-week timeline)

| Week | Curriculum milestone |
|---|---|
| 0 | Specialists hired, content templates finalised |
| 1 | First 2 lessons drafted (Numbers content area) — exercise full pipeline end-to-end |
| 2 | Pipeline locked; full authoring kicks off |
| 3–6 | Numbers + Algebra complete (9 lessons) |
| 7–10 | Geometry + Measurement complete (7 lessons) |
| 11–12 | Data Handling + buffer/revisions (3 lessons + fixes) |
| 13 | Editor final pass complete; all 19 lessons signed off |
| 14 | Content frozen for beta |
| 15–16 | Hot-fix only |

---

## 6. Content Sourcing Strategy

Three options, ranked:

### Option A (Recommended): In-house authoring + open-licensed supplements
- **Pros:** Quality control, SA voice, no IP issues, builds long-term content team
- **Cons:** Slower, requires hiring
- **Cost (MVP):** ~R 280–420K (2 specialists × 16 weeks)

### Option B: License existing CAPS-aligned content
- **Pros:** Fast
- **Cons:** Generic, often poorly digitised, ongoing royalties, locks competitive moat away
- **Cost:** R 150–500K + per-user royalties

### Option C: AI-generated content with human review
- **Pros:** Cheap, fast
- **Cons:** Quality is uneven; AI gets maths wrong in subtle ways; risks the whole brand
- **Verdict:** Use for **question generation drafts only**, never for lesson explanations or final published solutions. Always human-reviewed.

**Recommendation:** A as the spine; C to accelerate question generation (specialists review, don't write from scratch).

---

## 7. Content Operations (Beyond MVP)

### Phase 2 expansion
- Grades 8 and 10 (adjacent grades, same content team scales)
- Multilingual: lessons translated to Afrikaans, isiZulu first (highest-impact languages by speaker count in SA schools)
- Past-paper question banks (publicly available Department of Basic Education papers)

### Phase 3+
- Foundation Phase (R–3) — different pedagogy, separate specialist hires
- FET phase (Grades 10–12) — Matric prep premium tier
- Adaptive content: questions tagged with skill graph nodes for the recommendation engine

### Content CMS
- MVP: Git-based. Lessons are files. Engineering ingests at build/deploy time.
- Phase 2: Build an internal **Curriculum Management Portal** (per strategy doc §2) so specialists author without git.
- This is non-negotiable for scaling content beyond 50 lessons.

---

## 8. Licensing & IP

- All in-house content: GoMaths retains full IP. Specialists sign IP assignment in employment/contract.
- Any third-party content (images, datasets, problem sets): track in `curriculum-data/LICENSES.md`.
- Past papers from the Department of Basic Education are publicly accessible but check redistribution terms.
- **Do not** copy questions verbatim from published textbooks.

---

## 9. Quality Assurance

### 9.1 Pre-publish gates (automated)
- SymPy verifies every computable answer
- LaTeX renders without errors
- Schema validation on `metadata.json` and `questions.json`
- Spell-check + reading-level check

### 9.2 Pre-publish gates (manual)
- Peer review (specialist B)
- Editor pass
- Curriculum Lead sign-off

### 9.3 Post-publish monitoring
- Track per-question error rate (student answer correctness) — anomalies flag bad questions
- Tutor conversation review: weekly sample of 50, scored by a specialist
- Quarterly full curriculum audit

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Specialists can't be hired in time | Start hiring **Week –4** (before engineering kickoff). Have a network of freelance SA maths teachers as backup. |
| Authoring slower than 2 lessons/week | Buffer in schedule; option to bring in a third specialist on contract |
| Quality inconsistency between authors | Editor role, style guide, peer review |
| Content goes stale (curriculum updates) | Annual review cycle aligned to DBE updates |
| AI-assisted question generation produces wrong maths | SymPy gate + specialist review; never publish unverified |

---

## 11. Decisions Required Before Hiring

1. In-house vs. licensed content split (recommendation: A + supplements)
2. Style guide owner (typically the Editor)
3. Curriculum CMS build/buy decision for Phase 2 (decide by Month 3, ship by Month 9)
4. Translation strategy for Phase 2 (in-house translators vs. professional translation services)

---

## 12. Why This Matters

The strategy doc says: *"The biggest moat will be localized educational intelligence, learning data, and personalized AI-driven mathematics mastery for African learners."*

That moat is built one lesson at a time. The plan above is how it starts.
