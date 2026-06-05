# JobMatch

**AI-powered** job search

Example app for learning DevOps/SRE workflows and deploying to Kubernetes.

![Job search demo](demo.gif)

## What it does

- CV upload (PDF/text) and structured extraction
- **Agentic job search**  HTTP fetch + LLM-native web search (Gemini Google Search, OpenAI web search, Claude web search), then LLM ranking on verified URLs only
- Saved jobs in browser storage
- Agent **skills** under `skills/` injected into LLM system context per task

## Environment variables

Configuration lives in a single `.env` file at the repo root. **Never commit `.env`** — it is gitignored. Use `.env.example` as the template.

### Setup

1. Install dependencies:
   ```bash
   npm install
   npm install --prefix server
   ```
2. Copy and edit `.env`, then export it into your shell: `set -a && source .env && set +a`
   ```bash
   cp .env.example .env
   ```
   Set **one** LLM API key in `.env`. See [LLM provider](#llm-provider) below.
3. Start the app locally:
   ```bash
   npm run dev
   ```
   - UI: http://localhost:5173 (use `localhost`; Vite may bind IPv6 on Windows)
   - API: http://localhost:3001/api/health

   Restart the API after `.env` changes.

4. Verify configuration:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Look for `demoMode`, `llm.provider`, and `llm.jobSearchReady` in the JSON response.

Build and typecheck (optional):

```bash
npm run typecheck
npm run build
npm run build:api
```

### LLM provider

Set `LLM_PROVIDER=auto` (default) and provide **one** API key. Priority when `auto`:

1. `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` → [Claude](https://docs.anthropic.com/)
2. `GEMINI_API_KEY` → [Gemini](https://github.com/google-gemini/api-examples)
3. `OPENAI_API_KEY` → [OpenAI](https://developers.openai.com/api/docs/)

Or set `LLM_PROVIDER=openai`, `gemini`, or `claude` to force a provider (that key must be set).

### Variable reference

**LLM (set one key for real AI)**

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `LLM_PROVIDER` | Optional | `auto` | `auto`, `openai`, `gemini`, `claude`, or `demo` |
| `OPENAI_API_KEY` | Optional | — | OpenAI API key |
| `OPENAI_MODEL` | Optional | `gpt-4o-mini` | OpenAI model name |
| `GEMINI_API_KEY` | Optional | — | Google Gemini API key |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash-lite` | Gemini model name (free tier + web search) |
| `ANTHROPIC_API_KEY` | Optional | — | Anthropic API key |
| `CLAUDE_API_KEY` | Optional | — | Alias for `ANTHROPIC_API_KEY` |
| `CLAUDE_MODEL` | Optional | `claude-sonnet-4-20250514` | Claude model name |

**API server**

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `PORT` | Optional | `3001` | API listen port |
| `PUBLIC_URL` | Optional | `http://localhost:5173` | Public app URL (Docker: `http://localhost:8080`) |
| `UPLOAD_DIR` | Optional | `./uploads` | CV upload storage path |
| `SKILLS_DIR` | Optional | auto `./skills` | Agent skills directory |

**Local dev / Docker**

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `VITE_API_PROXY_TARGET` | Optional | `http://127.0.0.1:3001` | Vite dev proxy to API (local `npm run dev` only) |
| `HOST_PORT` | Optional | `8080` | Published web port in Docker Compose |

## Docker

```bash
cp .env.example .env
# Edit .env — set LLM keys; optionally HOST_PORT
docker compose up --build
```

Open http://localhost:8080 (or the port from `HOST_PORT`).

## Kubernetes

This repo is intended as a **reference app** for cluster exercises (Deployments, Services, Ingress, Secrets, PVCs for `server/data` and `server/uploads`).

Useful docs:

- [Kubernetes documentation](https://kubernetes.io/docs/home/)
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Services and networking](https://kubernetes.io/docs/concepts/services-networking/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)

Suggested layout: `web` Deployment (nginx + static build), `api` Deployment (Node), Ingress paths `/` and `/api`, Secrets for LLM API keys, `LLM_PROVIDER` in ConfigMap. See [Environment variables](#environment-variables).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health, LLM provider, loaded skills |
| POST | `/api/jobs/match` | Job search (LLM) |
| POST | `/api/cv/extract` | CV parsing (LLM) |
| POST | `/api/files/upload` | Upload CV file |

## Before production

This example is **not production-hardened**. Before any real deployment:

1. **Security review** — threat model, secrets handling, authentication, input validation. See [OWASP Top 10](https://owasp.org/www-project-top-ten/).
2. **Performance review** — load tests, LLM latency, nginx and API limits.
3. **Architecture review** — HA, observability, backup, multi-AZ.
4. **Cost analysis** — LLM token usage per search, storage, cluster cost.

## License

See [LICENSE](LICENSE).

---

Good luck on your path toward stronger platform and SRE practice — may your deploys be boring and your incidents short.
