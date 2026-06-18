# SRE Harness Phase 1: Agent Gateway Integration Walkthrough

We have successfully implemented and verified **Phase 1: Agent Gateway Integration** of the SRE Harness roadmap. All LLM calls from the backend server are now securely routed through the `AgentGateway` with model translation overrides, prompt safety checks, and dynamic routing configurations.

---

## 🛠️ Changes Implemented

### 1. Application Backend API Updates
* **[openai.ts](../../app/server/ai/providers/openai.ts)**: Modified constructor to support custom `baseURL` (pointing to the gateway) and mock API key fallback.
* **[gemini.ts](../../app/server/ai/providers/gemini.ts)** & **[claude.ts](../../app/server/ai/providers/claude.ts)**: Configured constructors and methods to fall back to the gateway-targeted `OpenAIProvider` transport when `GATEWAY_URL` is set in the environment.
* **[config.ts](../../app/server/config.ts)**: Updated key detection and provider selection logic to prevent forcing `demoMode` when `GATEWAY_URL` is configured.
* **[AIClient.ts](../../app/server/ai/AIClient.ts)**: Configured `createAIClient()` to directly return `OpenAIProvider` pointing to the gateway `baseURL` if `GATEWAY_URL` is set.
* **[llm.ts](../../app/server/services/llm.ts)**: Reverted `runAgenticJobMatch` to execute the local orchestration `runJobSearchAgent` (running native DOU.ua/Work.ua/Djinni crawlers) and route LLM queries through the gateway-enabled client.
* **[index.ts](../../app/server/index.ts)**: Commented out the `/mcp` routes for Phase 1.

### 2. GitOps & Gateway Infrastructure Updates
* **[agentgateway-backend.yaml](../../platform/flux/clusters/dev/apps/jobmatch/agentgateway-backend.yaml)**: 
  * Added `model: gemini-2.5-flash-lite` override to `gemini-backend`.
  * Added `model: claude-haiku-4-5` override to `claude-backend`.
  * This ensures that any model name requested by the client is correctly translated to the target upstream provider's expected format.
* **[agentgateway-config.yaml](../../platform/flux/clusters/dev/apps/jobmatch/agentgateway-config.yaml)**: Configured `LLM_PROVIDER: "claude"` in the gateway configmap data.
* **[helm-release.yaml](../../platform/flux/clusters/dev/apps/jobmatch/helm-release.yaml)**: Set `api.env.LLM_PROVIDER: "claude"` in dev values to override default chart envs.
* **[agentgateway-policy.yaml](../../platform/flux/clusters/dev/apps/jobmatch/agentgateway-policy.yaml)**: Fixed prompt prepend marshalling failure by changing the uppercase role `SYSTEM` to lowercase `system` as expected by the Envoy policy schema.

---

## 🧪 Verification & Validation Results

### 1. Verification of Type Safety & Build
* Run `npm run typecheck` in `app/server`:
  ```bash
  > job-match-api@1.0.0 typecheck
  > tsc --noEmit
  # Completed successfully with exit code 0
  ```
* Run `npm run build` in `app/server`:
  ```bash
  # Compiled successfully and populated dist/ directory.
  ```

### 2. Verification of GitOps Rollout
* Pushed commits to the `dev` branch on remote `origin-dmzopi`.
* GitOps build succeeded and the GHA bot pushed the tag commit `v1.0.0-cf62801`.
* Reconciled FluxCD git sources and Kustomizations. All pods transitioned to `Running` state.

### 3. API Execution & Gateway logs Validation
* Triggered a test job match query via `kubectl exec`:
  ```bash
  cat << 'EOF' | kubectl exec -i -n jobmatch-dev jobmatch-dev-api-59c556f5ff-j4x5v -- node
  # Request POST /api/jobs/match ...
  EOF
  ```
* **Result: 200 OK** containing structured vacancy list ranked and synthesized successfully!
* Log validation on `agentgateway-external` confirmed successful proxying and model overrides:
  ```
  2026-06-13T15:17:18.969817Z  info  request gateway=agentgateway-system/agentgateway-external listener=http route=agentgateway-system/llm-router endpoint=api.anthropic.com:443 src.addr=10.42.1.115:47246 http.method=POST http.host=agentgateway-external.agentgateway-system.svc.cluster.local http.path=/v1/chat/completions http.version=HTTP/1.1 http.status=200 protocol=llm gen_ai.operation.name=chat gen_ai.provider.name=anthropic gen_ai.request.model=claude-haiku-4-5 gen_ai.response.model=claude-haiku-4-5-20251001 gen_ai.usage.input_tokens=3192 gen_ai.usage.output_tokens=787 duration=6441ms
  ```
  * Request path received: `/v1/chat/completions` (OpenAI format)
  * Target model override applied: `claude-haiku-4-5`
  * Response model resolved: `claude-haiku-4-5-20251001`
  * Status code: `200` (success)
