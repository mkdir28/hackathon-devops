# HACKATHON TASK
## Scout: Job Searcher AI Assistant

The Scout startup has just raised a seed round for its AI job search assistant: it reads CVs, matches job postings, and drafts cover letters. The demo to investors went brilliantly, running on the founder's laptop with a single hardcoded API key and the system prompt hidden in a code comment.

Now, with the first 5,000 active users on the horizon, the legal team is nervous about GDPR, and the CFO just saw the first LLM provider invoice.

The founders are hiring you as their DevOps/Platform engineering team. The Scout application works (more or less). Your job is to transform this prototype into a production-ready system that will scale under load, secure candidate resumes, and keep operational costs within budget.

## Goal

Build and demonstrate a prototype of a complete engineering loop (Harness) around this agentic AI application: from commit to production deployment, featuring built-in evaluation gates, PII protection, and FinOps budgeting.

## What We Are Developing

The startup is launching an AI-powered job matching assistant. The feature set seems simple on the surface, but it requires a robust engineering platform behind it. Example repo: https://github.com/GregoryKoshelenko/devops-sre-job-match-app-example

Your task is to build everything necessary to make it production-ready, secure, and financially viable:

### 1. SDLC & "How to Build"
- Monorepo structure with clear boundaries: `app/` (API & worker code), `platform/` (Flux/Helm/Kustomize declarations), and `evals/` (testing suite).
- CI workflow on GitHub Actions or GitLab: lint → unit tests → build → push images.
- CD workflow using FluxCD (or ArgoCD): merging changes to the main branch renders manifests, and the controller reconciles the cluster state.
- Release process: promotions through environment overlays (dev → staging → prod).
- System prompts, skills (`SKILL.md`), and model settings are kept in Git as code, undergoing standard PR review workflows and evaluations. Any prompt changes trigger the evaluation suite.

### 2. Harness Engineering
- Memory: Candidate profiles (CV text, skills, dialogue context) + job cache: Vector store for semantic matching.
- Skill: `SKILL.md` defines agent capability footprints (e.g. search-jobs, tailor-cv, draft-cover-letter). Each skill is independently evaluated and verified.
- Protocols: MCP (Model Context Protocol) servers serving as tools (integrating job boards, scheduler actions, etc.).

### 3. Testing
- Standard unit/integration testing ensuring the agent formats requests, executes tool calls, and handles retries, errors, and timeouts gracefully.

### 4. Eval Suite (`evals/`)
- Set up test cases (CV + set of jobs -> expected ranking; job description -> cover letter quality across relevance, tone, and hallucination metrics).
- Scoring using the LLM-as-a-Judge pattern against expected criteria. CI Gate: PR is blocked if the evaluation score falls below the baseline.
- Maintain regression datasets checking for prompt injections and PII exposure in LLM responses.

### 5. Security
- Prompt Injection Mitigation: Resumes and web listings are untrusted inputs. Separate candidate contexts from instructions using XML tags, validate tool calls, and restrict the agent to a secure tool allow-list.
- PII / Data Governance: Minimize the volume of personal data sent to LLM providers.
- Secrets Management: Integrate central credential management on the gateway proxy (AgentGateway, External Secrets Operator) — zero plain keys in git.
- Supply Chain: Signed images (cosign), pinned digests, and SBOM records (optional).
- Output Guardrails: Filter out prompt leaks and age/gender bias/discrimination in matches.

### 6. Hosting & AI Providers
- Avoid single-provider locks. Offer alternatives. Compare model prices (Claude, Gemini, OpenAI) per million tokens.

### 7. FinOps Model
- Build a cost projection model: 5,000 active users, 20 searches/month, ~3K input tokens + ~800 output tokens.
- Establish the main unit metric: cost-per-active-user.

---

## Deliverables

Your system should be presented as a GitHub repository containing:
1. **ADR (Architectural Decision Records)** — explaining software design choices against functional/non-functional requirements.
2. **HLD (High-Level Solution Design)** — explaining system components, lifecycles, and deployment models.
3. **README** — detailing setup, configuration, and execution.
4. **Application and platform configurations.**
