## CI Data Ingestor

A lightweight webhook listener that ingests CI/CD pipeline events and publishes them to the data warehouse. It serves as the integration point between build and deployment systems and internal analytics pipelines.

### Features
- GitHub webhook endpoint with HMAC signature verification
- Canonical `CiEvent` schema validated with Zod
- Pluggable observability provider (Elasticsearch or none)
- Health and readiness endpoints

### Prerequisites
- Node.js 22+
- npm 10+
- (Optional) Elasticsearch 8.x available if `elasticsearch` provider is used

### Quick Start
```bash
npm install
npm run dev
```
Server listens on `HOST`:`PORT` (defaults: `0.0.0.0:3000`).

### Configuration
Set environment variables (e.g., via `.env`):
- `HOST` default `0.0.0.0`
- `PORT` default `3000`
- `OBSERVABILITY_PROVIDER` one of `elasticsearch` | `none` (default `elasticsearch`)
- `ELASTICSEARCH_NODE` default `http://localhost:9200`
- `ELASTICSEARCH_INDEX` default `ci-events`
- `ELASTICSEARCH_API_KEY` optional. Accepts either the API key secret (when ID provided) or the full base64 token used in `Authorization: ApiKey <token>`
- `GITHUB_WEBHOOK_SECRET` optional (recommended). If set, GitHub HMAC signatures will be verified.

### Routes
- `GET /health` → `{ status: "ok" }`
- `GET /ready` → `{ ready: true }`
- `POST /webhooks/ci` →  Accepts a canonical `CiEvent` directly (useful for tests or non‑GitHub sources you’ve already mapped yourself).
- `POST /webhooks/ci/github` → Accepts GitHub webhooks, maps to `CiEvent`, optional signature verification

### GitHub Webhook Setup
1. In your repo or organization settings → Webhooks, add a webhook to:
   - URL: `https://<your-host>/webhooks/ci/github`
   - Content type: `application/json`
   - Secret: set a strong value and export as `GITHUB_WEBHOOK_SECRET`
   - Events: `workflow_run`, `workflow_job`, `check_suite` (or your preference)

### GitHub events: which ones should you enable?

**TL;DR — Event matrix**

| Source | What you probably care about | Subscribe to | Use when |
|---|---|---|---|
| GitHub Actions | Workflow/Job results | `workflow_run` (and optionally `workflow_job`) | You run CI in GitHub Actions and want to ingest its outcomes. |
| External CI (Jenkins, Buildkite, TeamCity, etc.) | Check results shown on PR Checks tab | `check_suite` (+ `check_run` if you want per‑job detail) | Your CI is not Actions and it reports via the Checks API; you want to ingest what appears in the PR Checks UI and/or gate merges. |

You can keep both in this example repo: it demonstrates how to handle both varieties.

**Why both exist**
- `workflow_run` is specific to GitHub Actions orchestration. It fires when an Actions workflow is requested/in‑progress/completed.
- `check_suite` / `check_run` are part of the Checks API used by GitHub Apps/CI systems to publish results to the PR Checks UI and to branch‑protection. Jenkins (with the GitHub Checks plugins) typically emits these.

**Typical setups**
- Actions‑only: subscribe to `workflow_run` (and maybe `workflow_job`).
- Jenkins or other external CI: subscribe to `check_suite` (+ `check_run` for granular jobs). There is no `workflow_run` unless you also use Actions as a shim.
- Hybrid (optional): a tiny Actions workflow triggers Jenkins. You get `workflow_run` and Jenkins publishes `check_suite`—useful if you want to chain follow‑up Actions, but otherwise extra moving parts.

**Webhook configuration (GitHub)**
1. Go to Repository → Settings → Webhooks → Add webhook (or configure at the org level).
2. Payload URL: `https://<your-host>/webhooks/ci/github`.
3. Content type: `application/json`.
4. Secret: set a strong secret and mirror it in your service env (`GITHUB_WEBHOOK_SECRET`).
5. Which events? Choose “Let me select individual events” and tick:
   - Workflow runs (for Actions)
   - Check suites (and Check runs if you want job‑level detail)
   You can add more events later; this service will ignore what it doesn’t handle.

### Example
Send a canonical event directly (bypassing GitHub mapping):
```bash
curl -X POST http://localhost:3000/webhooks/ci \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "abc123",
    "provider": "github",
    "project": "org/repo",
    "repo": "org/repo",
    "branch": "main",
    "commitSha": "deadbeef",
    "status": "running",
    "eventType": "pipeline"
  }'
```

### Elasticsearch
When `OBSERVABILITY_PROVIDER=elasticsearch`, events are indexed into `ELASTICSEARCH_INDEX` using `ELASTICSEARCH_NODE` with API Key auth only.

Elastic Cloud API key setup:
1. In Kibana → Stack Management → API keys → Create API key.
2. Scope minimally to index privileges on your target index (e.g., `ci-events*`: write, create_index, create_doc).
3. Export env:
```bash
# Single base64 token (as used by curl Authorization header)
ELASTICSEARCH_API_KEY=<base64_id_colon_key>
```
The client requires `ELASTICSEARCH_API_KEY` (base64 token).

### Docker
```bash
docker build -t ci-data-ingestor .
PORT=${PORT:-3000}
docker run --rm -p $PORT:$PORT \
  -e HOST=0.0.0.0 -e PORT=$PORT \
  -e OBSERVABILITY_PROVIDER=elasticsearch \
  -e ELASTICSEARCH_NODE=http://host.docker.internal:9200 \
  ci-data-ingestor
```

### Development
```bash
npm run dev
```

### Tests
```bash
npm test
```
