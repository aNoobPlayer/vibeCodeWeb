# Product & Engineering Roadmap

This backlog tracks every improvement idea that emerged from the system review. Items are grouped by initiative, broken into concrete tasks, and ordered roughly by dependency. Pick up the earliest unblocked sub-task in each section.

---

## 1. Schema Governance & Source of Truth
1.1 **Align on migrations as the canonical schema**
- [ ] Audit Prisma `schema.prisma` vs. actual SQL Server (run `prisma migrate diff`)
- [ ] Document the decision: “all schema changes go through Prisma migrations”
- [ ] Remove any ad-hoc SQL edits that bypass Prisma

1.2 **Automate bootstrap SQL generation**
- [ ] Create a script that reads Prisma migration history and emits `server/bootstrap-schema.ts`
- [ ] Wire the script into `npm run build` (or dedicated `npm run schema:bootstrap`)
- [ ] Add CI check to fail if generated bootstrap differs from committed file

1.3 **Schema Doctor CLI**
- [ ] Implement `scripts/schema-doctor.ts` that:
  - [ ] Runs `prisma migrate status`
  - [ ] Validates every table referenced in `server/storage.ts` exists
  - [ ] Compares JSON column mappings (e.g., template `skillsJson`) with TypeScript types
- [ ] Add npm script + docs on interpreting failures

1.4 **Deterministic seed templates**
- [ ] Move default templates into Prisma seed (e.g., `prisma/seed/templates.ts`)
- [ ] Use checksums to decide insert/update vs. skip
- [ ] Expose `npm run seed:templates`
- [ ] Update `/api/templates/reset` to call the same seeding logic

---

## 2. Modular Admin UI
2.1 **Routing & layout groundwork**
- [x] Create `client/src/layouts/AdminShell.tsx` housing sidebar/topbar
- [x] Move current dashboard content into route components (`/admin/dashboard`, `/admin/questions`, etc.)
- [ ] Update router to lazy-load each admin page

2.2 **Feature slices**
- [ ] Set up `client/src/features/<domain>` directories (questions, templates, sets, tips, media, users)
- [ ] Relocate domain-specific components and hooks into their slices
- [ ] Export public APIs (hooks + components) from each slice

2.3 **Design system primitives**
- [ ] Define spacing/typography tokens (CSS variables or Tailwind config)
- [ ] Introduce layout primitives (Stack, Grid, ScrollPanel) in `@/components/layout`
- [ ] Incrementally replace bespoke flex/grid combos with primitives

---

## 3. Guided Question Authoring
3.1 **Template intelligence**
- [ ] Add heuristic matcher that suggests templates based on current prompt text
- [ ] Surface suggestions inline with confidence scores

3.2 **Content linting**
- [ ] Implement lint rules (min/max length, missing instructions, distractor count)
- [ ] Render warnings in the builder with quick-fix buttons

3.3 **AI co-pilot (optional, gated)**
- [ ] Add service for LLM calls (mock + pluggable real provider)
- [ ] Generate sample distractors, tags, and answer explanations on demand
- [ ] Add audit log entries for AI-assisted changes

3.4 **Collaboration & drafts**
- [ ] Extend schema with `status`, `owner`, `reviewers`, `history`
- [ ] Support saving drafts + comment threads
- [ ] Add revision timeline UI

---

## 4. Set Composition Intelligence
4.1 **Coverage dashboard**
- [ ] Build visualization showing required vs. actual questions per skill/difficulty
- [ ] Hook into question metadata to calculate gaps

4.2 **Smart recommendations**
- [ ] Rankings for candidate questions (by skill match, freshness, difficulty)
- [ ] Inline “Add to set” chips with one-click assignment

4.3 **Simulation preview**
- [ ] Assemble set flow preview (media, prompts, estimated timing)
- [ ] Allow admins to reorder sections via drag-and-drop

---

## 5. Template Lifecycle & Analytics
5.1 **Versioning**
- [ ] Update DB schema with `version`, `status`, `parentTemplateId`
- [ ] Track which questions use which template version

5.2 **Usage insights**
- [ ] Store usage counts + last applied timestamps
- [ ] Display metrics in Template Studio cards
- [ ] Flag underused or deprecated templates

5.3 **Template playground**
- [ ] Build preview sandbox showing student view + scoring
- [ ] Allow editing parameters and exporting sample question JSON

---

## 6. State & Data Layer Cohesion
6.1 **React Query registry**
- [x] Create `client/src/lib/queryKeys.ts` exporting typed keys
- [ ] Centralize shared query hook factories (`createEntityQueryHook`)

6.2 **Domain hooks**
- [x] `useQuestions`, `useTestSets`, `useTemplates`, etc., returning data hooks
- [ ] Add mutation helpers per domain (create/update/delete abstractions)
- [x] Replace inline `useQuery` usage across admin pages for templates/questions/sets/tips/media/users
- [ ] Migrate remaining sections (grading queue, activities, etc.) to shared hooks

6.3 **Server-driven filtering**
- [ ] Extend `/api/questions` and `/api/test-sets` to accept filter params
- [ ] Update hooks to pass filters + manage pagination state

6.4 **Activity/notification channel**
- [ ] Publish meaningful events from backend mutations
- [ ] Display a toast/notification feed fed by these events

---

### Execution Notes
- Always keep this file updated when tasks are completed or re-scoped.
- Large tasks should be broken down further into PR-sized sub-items before coding.
