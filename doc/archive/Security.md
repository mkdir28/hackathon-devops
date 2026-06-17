# Security — Secrets Management with External Secrets Operator (ESO)

This document describes how **JobMatch** manages LLM API keys using **External Secrets Operator (ESO)** and **GCP Secret Manager**. It includes an implementation review, the rationale for GitOps delivery, prerequisites, a full cluster bootstrap guide, and verification steps.

---

## 1. Implementation Review

### What is correct

| Component | Location | Status |
|-----------|----------|--------|
| ESO namespace | `platform/flux/clusters/{dev,prod}/infra/eso/namespace.yaml` | Correct |
| HelmRepository for ESO chart | `.../infra/eso/helm-repository.yaml` | Correct |
| ESO HelmRelease (GitOps) | `.../infra/eso/helm-release.yaml` | Correct |
| ClusterSecretStore (GCP) | `.../infra/eso/cluster-secret-store.yaml` | Correct — `projectID: happy-deploys-job-searcher` |
| Workload Identity annotation | `.../infra/eso/helm-release.yaml` | Correct — `eso-sa@happy-deploys-job-searcher.iam.gserviceaccount.com` |
| ExternalSecret (dev) | `platform/flux/clusters/dev/apps/jobmatch/external-secret.yaml` | Correct after fix |
| ExternalSecret (prod) | `platform/flux/clusters/prod/apps/jobmatch/external-secret.yaml` | Correct after fix |
| Infra Kustomization | `platform/flux/clusters/{dev,prod}/infra/kustomization.yaml` | Correct — references all ESO resources |
| App Kustomization | `platform/flux/clusters/{dev,prod}/apps/jobmatch/kustomization.yaml` | Correct — includes `external-secret.yaml` |
| Deploy ordering | `platform/flux/clusters/{dev,prod}/flux-system/apps.yaml` | Correct — `dependsOn: infra-bootstrap` + ESO health check |
| API consumption | `platform/helm/jobmatch/templates/deployment-api.yaml` | Correct — reads `llm-secrets` key `gemini-api-key` |

### What was fixed

1. **`remoteRef.key` mismatch (critical)**  
   `ExternalSecret` previously referenced `gemini-api-key` in GCP Secret Manager, but the secret stored in GCP is named **`GEMINI_API_KEY`**.  
   - GCP secret name → `remoteRef.key: GEMINI_API_KEY`  
   - Kubernetes secret key → `secretKey: gemini-api-key` (matches `deployment-api.yaml`)

2. **Race condition on first deploy**  
   `scout-apps-bootstrap` could apply `ExternalSecret` before ESO CRDs/controller were ready. Added a `healthChecks` entry for the `external-secrets` Deployment in `apps.yaml`.

### Secret mapping (end-to-end)

```
GCP Secret Manager                    Kubernetes Secret              API Pod
─────────────────────                 ─────────────────              ───────
secret name: GEMINI_API_KEY    →      llm-secrets                    env: GEMINI_API_KEY
                                      key: gemini-api-key      ←     secretKeyRef: gemini-api-key
```

---

## 2. Why GitOps via FluxCD HelmRelease for ESO?

Manual `helm install` works for a one-off bootstrap, but this repository already uses **FluxCD + Git as the single source of truth** (see [ADR-003](../ADR.md) and [cicd.md](cicd.md)). ESO is delivered the same way as the application for these reasons:

| Reason | Explanation |
|--------|-------------|
| **Consistency with existing CD model** | JobMatch, Redis, and Qdrant are deployed via Flux `HelmRelease`. ESO follows the same pattern — no special-case manual installs. |
| **Auditability & rollback** | Every ESO version, CRD policy, and Workload Identity annotation is versioned in Git. Rollback = `git revert` + Flux reconcile. |
| **Environment parity** | `dev` and `prod` each have identical ESO manifests under `platform/flux/clusters/{dev,prod}/infra/eso/`, reducing configuration drift. |
| **Automated upgrades** | Flux polls the Helm repository and can upgrade ESO chart versions declaratively (`version: "0.*"`). |
| **No kubeconfig in CI** | Flux runs inside the cluster; secrets infrastructure is reconciled without storing cluster credentials in GitHub Actions. |
| **Ordered deployment** | `infra-bootstrap` → ESO ready → `scout-apps-bootstrap` ensures `ExternalSecret` is applied only after the operator exists. |

**When to use manual `helm install` instead:** only for initial Flux bootstrap on a brand-new empty cluster, or for local debugging before GitOps is wired. After Flux is running, all changes should go through Git.

---

## 3. Prerequisites

### GCP (run once)

These commands are executed from your **local machine** or **Google Cloud Shell** — anywhere `gcloud` is authenticated.

```bash
export GCP_PROJECT_ID="happy-deploys-job-searcher"
export GCP_SA_NAME="eso-sa"
export K8S_NAMESPACE="external-secrets"
export K8S_SA_NAME="external-secrets"   # default ESO chart ServiceAccount name

# 1. Verify the secret exists in Secret Manager
gcloud secrets describe GEMINI_API_KEY --project="${GCP_PROJECT_ID}"

# 2. Create a GCP Service Account for ESO (skip if already created)
gcloud iam service-accounts create "${GCP_SA_NAME}" \
  --project="${GCP_PROJECT_ID}" \
  --display-name="External Secrets Operator"

# 3. Grant read access to Secret Manager
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${GCP_SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 4. Bind Workload Identity (GKE only — see Section 7 for k3d/local)
gcloud iam service-accounts add-iam-policy-binding \
  "${GCP_SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:${GCP_PROJECT_ID}.svc.id.goog[${K8S_NAMESPACE}/${K8S_SA_NAME}]"
```

### Local tools

- `kubectl` — talks to the Kubernetes API
- `helm` — optional; only needed for manual ESO install or debugging
- `flux` CLI — for bootstrap and reconciliation checks
- `gcloud` — for GCP Secret Manager and (optionally) GKE cluster access

---

## 4. Full Bootstrap: Kubernetes + FluxCD + Application + ESO

This section explains how to run the **entire stack** locally or on GKE **before** pushing ESO changes, so you can validate end-to-end behavior.

### Where do commands run?

| Tool / command | Where to run |
|----------------|--------------|
| `gcloud secrets ...`, `gcloud iam ...` | Local terminal or **Cloud Shell** (GCP project context) |
| `gcloud container clusters get-credentials ...` | Local terminal or Cloud Shell — configures `kubectl` for GKE |
| `k3d cluster create ...` | **Your local machine** (macOS/Linux with Docker) |
| `flux bootstrap ...`, `kubectl ...`, `helm ...` | Machine that has **network access to the cluster API** (local machine after `kubectl` context is set, or SSH into GCP VM running k3d) |

> **Important:** Verification commands (`kubectl get ...`) are **not** run inside GCP Secret Manager or "in gcloud". They use `kubectl` against your Kubernetes cluster. `gcloud` is only for GCP resources (secrets, IAM, GKE credentials).

---

### Option A — Local k3d cluster (fastest for development)

Workload Identity does **not** work on k3d. For local testing with real GCP Secret Manager, use a **GCP Service Account JSON key** (see Section 7). For a quick UI/API smoke test without ESO, you can still create a manual secret (Phase 1 workaround).

#### Step A1 — Create the cluster

```bash
k3d cluster create jobmatch --port 8080:80@loadbalancer
kubectl cluster-info
```

#### Step A2 — Install FluxCD

```bash
# Install flux CLI: https://fluxcd.io/flux/installation/
flux check --pre

# Bootstrap Flux against this repo (dev branch, dev cluster path)
flux bootstrap github \
  --owner=dmzopi \
  --repository=hackathon-devops \
  --branch=dev \
  --path=platform/flux/clusters/dev \
  --personal
```

If Flux is already bootstrapped and you only need to apply local changes without pushing:

```bash
# From repo root — apply dev cluster manifests directly
kubectl apply -k platform/flux/clusters/dev/flux-system/

# Force reconciliation
flux reconcile source git flux-system -n flux-system
flux reconcile kustomization flux-system -n flux-system
```

#### Step A3 — Wait for GitOps reconciliation

```bash
# Watch top-level Flux Kustomization
flux get kustomizations -n flux-system

# Expected order:
# 1. flux-system        → Ready
# 2. infra-bootstrap    → Ready (ESO installed)
# 3. scout-apps-bootstrap → Ready (app + ExternalSecret)
```

#### Step A4 — Confirm the application is running

```bash
kubectl get pods -n jobmatch-dev
kubectl get svc -n jobmatch-dev

# Port-forward if no Ingress/Gateway is configured yet
kubectl port-forward -n jobmatch-dev svc/jobmatch-dev-web 8080:80 &
kubectl port-forward -n jobmatch-dev svc/jobmatch-dev-api 3001:3001 &

# Health check
curl http://localhost:3001/api/health
```

Open `http://localhost:8080` for the frontend.

---

### Option B — GKE cluster (production-like, Workload Identity)

#### Step B1 — Create or select a GKE cluster

```bash
export GCP_PROJECT_ID="happy-deploys-job-searcher"
export GKE_CLUSTER="jobmatch-dev"    # your cluster name
export GKE_ZONE="us-central1-a"      # your zone

gcloud container clusters get-credentials "${GKE_CLUSTER}" \
  --zone="${GKE_ZONE}" \
  --project="${GCP_PROJECT_ID}"
```

#### Step B2 — Bootstrap FluxCD (first time only)

```bash
flux bootstrap github \
  --owner=dmzopi \
  --repository=hackathon-devops \
  --branch=dev \
  --path=platform/flux/clusters/dev \
  --personal
```

#### Step B3 — Push ESO manifests and let Flux deploy

```bash
git add platform/flux/clusters/dev/infra/ \
        platform/flux/clusters/dev/apps/jobmatch/external-secret.yaml \
        platform/flux/clusters/dev/apps/jobmatch/kustomization.yaml \
        platform/flux/clusters/dev/flux-system/apps.yaml

git commit -m "feat(security): add External Secrets Operator and GCP Secret Manager sync"
git push origin dev
```

Flux on the cluster pulls the `dev` branch automatically (interval: 1m per `gotk-sync.yaml`).

#### Step B4 — Monitor rollout

```bash
flux get kustomizations -n flux-system --watch
kubectl get helmrelease -n flux-system
kubectl get pods -n external-secrets -w
kubectl get pods -n jobmatch-dev -w
```

---

## 5. Verify Secrets Management Works

Run these on the machine where `kubectl` is configured (local terminal or Cloud Shell **after** `get-credentials`).

### 5.1 ESO operator health

```bash
kubectl get pods -n external-secrets
# EXPECTED: external-secrets-* pods Running

kubectl get deployment external-secrets -n external-secrets
# EXPECTED: READY 1/1
```

### 5.2 ClusterSecretStore connected to GCP

```bash
kubectl get clustersecretstore gcp-secret-manager
# EXPECTED: STATUS = Valid / Ready

kubectl describe clustersecretstore gcp-secret-manager
# Check Events — no authentication or permission errors
```

If `InvalidProviderConfig` or `AccessDenied` appears, re-check:
- GCP SA has `roles/secretmanager.secretAccessor`
- Workload Identity binding (GKE) or JSON key secret (k3d) is configured

### 5.3 ExternalSecret synced

```bash
kubectl get externalsecret llm-secrets -n jobmatch-dev
# EXPECTED: STATUS = SecretSynced, READY = True

kubectl describe externalsecret llm-secrets -n jobmatch-dev
# Check Conditions and Events
```

### 5.4 Kubernetes Secret created by ESO

```bash
kubectl get secret llm-secrets -n jobmatch-dev
# EXPECTED: TYPE = Opaque, AGE > 0

kubectl describe secret llm-secrets -n jobmatch-dev
# EXPECTED: key "gemini-api-key" present (value is hidden)
```

### 5.5 API pod receives the key

```bash
kubectl get pods -n jobmatch-dev -l app=jobmatch-dev-api
API_POD=$(kubectl get pods -n jobmatch-dev -l app=jobmatch-dev-api -o jsonpath='{.items[0].metadata.name}')

# Confirm env var is set (value is redacted by kubectl)
kubectl exec -n jobmatch-dev "${API_POD}" -- printenv GEMINI_API_KEY | wc -c
# EXPECTED: character count > 1 (non-empty)

# Functional check — API health
kubectl port-forward -n jobmatch-dev svc/jobmatch-dev-api 3001:3001 &
curl -s http://localhost:3001/api/health
```

### 5.6 FluxCD reconciliation (GitOps layer)

```bash
flux get helmrelease external-secrets -n flux-system
flux get kustomization infra-bootstrap -n flux-system
flux get kustomization scout-apps-bootstrap -n flux-system
# All EXPECTED: Ready=True
```

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ExternalSecret` status `SecretSyncedError` | Wrong GCP secret name | Ensure `remoteRef.key: GEMINI_API_KEY` |
| `ClusterSecretStore` not Ready | Missing IAM or Workload Identity | Re-run Section 3 GCP commands |
| `externalsecret` CRD not found | ESO not installed yet | Wait for `infra-bootstrap`; check `flux get helmrelease` |
| API pod starts but LLM calls fail | Empty secret / wrong key name | Verify `gemini-api-key` key in `llm-secrets` |
| Works on GKE, fails on k3d | Workload Identity unavailable | Use JSON key auth (Section 7) |

Useful logs:

```bash
kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets --tail=100
kubectl logs -n jobmatch-dev -l app=jobmatch-dev-api --tail=50
```

---

## 7. Local k3d + GCP Secret Manager (JSON key auth)

On non-GKE clusters, replace Workload Identity with a Kubernetes Secret holding a GCP SA key.

```bash
# Create key (run locally — never commit the JSON file)
gcloud iam service-accounts keys create /tmp/gcp-eso-key.json \
  --iam-account="eso-sa@happy-deploys-job-searcher.iam.gserviceaccount.com"

kubectl create secret generic gcp-sa-key \
  --from-file=key.json=/tmp/gcp-eso-key.json \
  --namespace external-secrets

rm /tmp/gcp-eso-key.json
```

Update `platform/flux/clusters/dev/infra/eso/cluster-secret-store.yaml`:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secret-manager
spec:
  provider:
    gcpsm:
      projectID: "happy-deploys-job-searcher"
      auth:
        secretRef:
          secretAccessKeySecretRef:
            name: gcp-sa-key
            key: key.json
            namespace: external-secrets
```

Remove the `iam.gke.io/gcp-service-account` annotation from the ESO HelmRelease values for local clusters.

> The JSON key secret (`gcp-sa-key`) must **not** be committed to Git. Create it manually or via a secure secret-delivery mechanism.

---

## 8. Repository Layout Reference

```
platform/flux/clusters/dev/
├── flux-system/
│   ├── gotk-sync.yaml          # GitRepository → branch: dev
│   ├── gotk-components.yaml    # Flux controllers
│   ├── apps.yaml               # infra-bootstrap, scout-apps-bootstrap (with dependsOn)
│   └── kustomization.yaml
├── infra/
│   ├── kustomization.yaml
│   └── eso/
│       ├── namespace.yaml
│       ├── helm-repository.yaml
│       ├── helm-release.yaml       # ESO HelmRelease
│       └── cluster-secret-store.yaml
└── apps/jobmatch/
    ├── ns.yaml
    ├── helm-release.yaml           # JobMatch app
    ├── external-secret.yaml        # llm-secrets ← GEMINI_API_KEY
    └── kustomization.yaml
```

---

## 9. Security Checklist (ADR-006)

- [ ] No API keys in source code, Docker images, or Git
- [ ] `GEMINI_API_KEY` stored only in GCP Secret Manager
- [ ] ESO syncs secrets automatically (`refreshInterval: 1h`)
- [ ] Manual `kubectl create secret llm-secrets ...` removed from normal workflow
- [ ] Workload Identity used on GKE (no long-lived JSON keys in production)
- [ ] Flux `dependsOn` + `healthChecks` ensure correct deploy order
- [ ] Prod changes promoted via PR to `main` (see [cicd.md](cicd.md))

---

## 10. Related Documents

- [ADR-006 — Security Controls](../ADR.md)
- [Architecture Implementation Roadmap — Phase 5](../roadmap.md)
- [CI/CD & GitOps Guide](cicd.md)
