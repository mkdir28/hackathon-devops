# Локальна розробка: Управління секретами без Google Secret Manager

Цей мануал описує, як налаштувати секрети для `AgentGateway` локально на робочій станції розробника (наприклад, у локальному кластере k3s / minikube / kind) без інтеграції з хмарним сервісом Google Secret Manager (GCP SM).

Оскільки хмарні контури (Dev та Prod у хмарі GCP) є однотипними та використовують `gcp-secret-manager` для автоматичної синхронізації через External Secrets Operator (ESO), для локального запуску є два шляхи:

---

## 🚀 Спосіб 1: Пряме створення секретів (Рекомендований та найпростіший)

Оскільки шлюз `AgentGateway` (Envoy) просто монтує готові Kubernetes Secrets (`claude-auth-secret`, `gemini-auth-secret` тощо) зі свого простору імен `agentgateway-system`, вам не обов'язково запускати або налаштовувати External Secrets Operator локально. Ви можете створити секрети вручну.

### Крок 1: Створіть простір імен для шлюзу (якщо ще не створено)
```bash
kubectl create namespace agentgateway-system --dry-run=client -o yaml | kubectl apply -f -
```

### Крок 2: Створіть секрети із вашими реальними API-ключами
Виконайте команди, підставивши власні токени розробника:

```bash
# Для Anthropic Claude
kubectl create secret generic claude-auth-secret -n agentgateway-system \
  --from-literal=Authorization="Bearer YOUR_CLAUDE_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

# Для Google Gemini
kubectl create secret generic gemini-auth-secret -n agentgateway-system \
  --from-literal=Authorization="Bearer YOUR_GEMINI_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

# Для OpenAI (якщо використовується)
kubectl create secret generic openai-auth-secret -n agentgateway-system \
  --from-literal=Authorization="Bearer YOUR_OPENAI_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 🛠️ Спосіб 2: Локальна імітація ESO (через `local-k8s-store`)

Якщо ви хочете протестувати роботу External Secrets Operator локально без хмари, ви можете використати локальний `ClusterSecretStore` на базі `kubernetes` провайдера.

### Крок 1: Створіть сирий секрет у просторі імен додатка (`jobmatch-dev`)
Створіть секрет `llm-secrets`, який міститиме всі ваші ключі:
```bash
kubectl create secret generic llm-secrets -n jobmatch-dev \
  --from-literal=openai-api-key="YOUR_OPENAI_API_KEY" \
  --from-literal=claude-api-key="YOUR_CLAUDE_API_KEY" \
  --from-literal=gemini-api-key="YOUR_GEMINI_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Крок 2: Застосуйте локальний ClusterSecretStore
Створіть `local-k8s-store`, який дозволить ESO читати секрети з `jobmatch-dev` за допомогою сервісного акаунту оператора:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: local-k8s-store
spec:
  provider:
    kubernetes:
      server:
        caProvider:
          type: ConfigMap
          name: kube-root-ca.crt
          key: ca.crt
      readOnly: true
      remoteNamespace: jobmatch-dev
      auth:
        serviceAccount:
          name: external-secrets-external-secrets
          namespace: external-secrets
```
*Збережіть цей маніфест як `local-store.yaml` та застосуйте: `kubectl apply -f local-store.yaml`.*

### Крок 3: Перевизначте ExternalSecrets для локального магазину
Створіть або оновіть ресурси `ExternalSecret` в `agentgateway-system`, вказавши `local-k8s-store` замість `gcp-secret-manager`:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: claude-auth-secret
  namespace: agentgateway-system
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: local-k8s-store
    kind: ClusterSecretStore
  target:
    name: claude-auth-secret
    creationPolicy: Owner
  data:
  - secretKey: Authorization
    remoteRef:
      key: llm-secrets
      property: claude-api-key
      conversionStrategy: Default
      decodingStrategy: None
```
*(Аналогічно для `gemini-auth-secret` та `openai-auth-secret`).*
