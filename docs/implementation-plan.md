# VANITY MVP Implementation Plan

## Frozen baselines

- Product logic: PRD v1.0 + Development Spec.
- Visual design: Figma `06 Mobile Flow`, 430 × 932.
- Product output: Chinese by default.
- Follow-up: at most one high-value question per plan generation.
- Add Product: package-photo recognition remains a visual entry only in MVP; the implemented path is text query → Web Search → LLM Normalize → up to three candidates.

## Milestones

1. **Foundation and primary route** — repository, contracts, design tokens, routing, Landing, Home, Scene Input.
2. **Local product shell** — Beauty Bag CRUD, five-entry Plan History, demo fixtures, remaining Figma-aligned screens.
3. **LLM main route** — context parser, one-question guard, plan generation, schema and policy validation.
4. **Refinement** — local patch and global replan behavior.
5. **Real inputs** — speech-to-text, weather with explicit location consent, constrained vision.
6. **Product search** — web search, evidence-bound normalization, candidate confirmation.
7. **QA and release** — visual comparison, privacy audit, error recovery, end-to-end tests, deployment.
