# Інтеграція з Agentic Sandbox (abox) & GitOps у GCP

Цей документ містить аналіз ідеї розгортання кластера на базі **abox** на віртуальній машині в GCP, інструкцію з розгортання та детальний опис структури папки FluxCD для ізоляції середовищ на рівні Namespace.

---

## 1. Аналіз ідеї (Оцінка рішення)

Ідея розгорнути Kubernetes-кластер за допомогою **abox** на віртуальній машині (Compute Engine) в GCP з ізоляцією середовищ на рівні Namespace є **надзвичайно вдалою та оптимальною для хакатону** з кількох причин:

### 👍 Чому це гарна ідея (Плюси):
1. **Економічність (Cost Efficiency):** Замість створення 2-3 окремих керованих кластерів GKE (що коштує дорого та довго розгортається), ви використовуєте одну потужну віртуальну машину (наприклад, `e2-standard-4` або `e2-standard-8`), яка хостить локальний KinD-кластер. Це економить бюджет хакатону та дозволяє вкластися у безкоштовні ліміти.
2. **Все включено з коробки (Out-of-the-Box AI Infra):** `abox` автоматично ставить **AgentGateway** (Gateway API) та **kagent**, що закриває вимоги хакатону щодо AI-інфраструктури та безпеки промптів.
3. **Швидкість розгортання:** Створення кластера через KinD/k3d у VM триває менше 3 хвилин. Будь-які помилки лікуются простим видаленням та перестворенням VM.
4. **Namespace-ізоляція:** Спільний кластер з різними Namespace (`jobmatch-dev`, `jobmatch-staging`, `jobmatch-prod`) є класичним патерном для невеликих команд. Він забезпечує швидкий мережевий зв'язок та спільне використання ресурсів (наприклад, одна інстанція Qdrant або Redis може хостити різні бази для dev/prod).

### ⚠️ На що звернути увагу (Ризики):
* **Обмеження ресурсів VM:** Потрібно обрати VM з достатньою кількістю ресурсів. Рекомендовано мінімум **4 vCPU, 16 GB RAM (e2-standard-4)** та 50-100 GB SSD диском.
* **Вкладена віртуалізація:** KinD працює в Docker, тому VM повинна мати встановлений Docker. Вкладена віртуалізація (nested virtualization) не обов'язкова для KinD, що спрощує вибір типу VM в GCP.

---

## 2. Як правильно розгортати цей кластер у GCP

### Крок 1: Створення VM в GCP Compute Engine
Створіть віртуальну машину через gcloud CLI або консоль GCP:
```bash
gcloud compute instances create abox-sandbox \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server
```
*Важливо: переконайтеся, що у Firewall GCP дозволено вхідний HTTP/HTTPS трафік (порти 80, 443).*

### Крок 2: Встановлення Docker на VM
Підключіться до VM через SSH та встановіть Docker:
```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER
newgrp docker
```

### Крок 3: Клонування та запуск abox
```bash
git clone https://github.com/den-vasyliev/abox.git
cd abox
make run
```
Ця команда автоматично встановить OpenTofu, k9s, розгорне KinD кластер із 3 нодами, підніме FluxCD та встановить AgentGateway з kagent.

---

## 3. CI/CD для середовищ, ізольованих на рівні Namespace

Оскільки всі середовища живуть в одному кластері, CI/CD будується через реліз-тегування в GHCR та сканування Flux:

1. **Гілка `dev`** -> GHA збирає образ `jobmatch-api:v1.0.0-<sha>-dev` -> Пушить в GHCR.
2. **Гілка `main`** -> GHA збирає образ `jobmatch-api:v1.0.0-<sha>` -> Пушить в GHCR.
3. **Flux ImagePolicies** сканують GHCR та фільтрують теги:
   * `jobmatch-api-dev` реагує тільки на теги `*-dev`. При появі нового тегу Flux оновлює файл `platform/environments/dev/deployment.yaml` і застосовує його в namespace `jobmatch-dev`.
   * `jobmatch-api-prod` реагує на чисті версії (semver). При появі нового тегу Flux оновлює `platform/environments/prod/deployment.yaml` у namespace `jobmatch-prod`.

---

## 4. Структура папки Flux з маніфестами (GitOps Repository Layout)

Для керування середовищами через FluxCD, папка `platform/` у нашому репозиторії структурується наступним чином:

```
platform/
├── flux/
│   ├── gotk-sync.yaml             # Конфігурація підключення Flux до Git
│   └── kustomizations.yaml        # Опис Kustomizations для dev та prod
├── environments/
│   ├── dev/
│   │   ├── kustomization.yaml     # Оверлей для dev (Namespace: jobmatch-dev)
│   │   └── deployment.yaml        # Деплоймент з маркером автооновлення образу
│   └── prod/
│       ├── kustomization.yaml     # Оверлей для prod (Namespace: jobmatch-prod)
│       └── deployment.yaml        # Деплоймент з маркерами лімітів та реплік
└── flux-image-policy.yaml         # Правила сканування GHCR та автокомітів
```

### Приклади ключових маніфестів Flux:

#### 📂 `platform/flux/kustomizations.yaml`
Цей файл описує, як FluxCD повинен застосовувати наші конфігурації в різні Namespace.
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: jobmatch-dev-sync
  namespace: flux-system
spec:
  interval: 2m0s
  path: ./platform/environments/dev
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
  decryption:
    provider: sops # Якщо використовуємо SOPS секрети
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: jobmatch-prod-sync
  namespace: flux-system
spec:
  interval: 5m0s
  path: ./platform/environments/prod
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
```

#### 📂 `platform/environments/dev/kustomization.yaml`
Оверлей для розробки. Створює namespace `jobmatch-dev` та генерує скіли як ConfigMap.
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: jobmatch-dev

resources:
  - deployment.yaml

# Генерація скілів як ConfigMap (PromptOps)
configMapGenerator:
  - name: jobmatch-skills
    files:
      - agent-tools.md=skills/agent-tools/SKILL.md
      - cv-extraction.md=skills/cv-extraction/SKILL.md
      - global-job-boards.md=skills/global-job-boards/SKILL.md
      - job-analyzer.md=skills/job-analyzer/SKILL.md
      - job-crawler.md=skills/job-crawler/SKILL.md
      - job-match-scoring.md=skills/job-match-scoring/SKILL.md
      - job-search.md=skills/job-search/SKILL.md
      - structured-output.md=skills/structured-output/SKILL.md
      - transferable-skills.md=skills/transferable-skills/SKILL.md

labels:
  - includeSelectors: true
    pairs:
      environment: development
```

#### 📂 `platform/environments/dev/deployment.yaml`
Конфігурація деплойменту в dev з монтуванням ConfigMap.
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jobmatch-api
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: api
          image: ghcr.io/mkdir28/jobmatch-api:v1.0.0-dev # {"$imagepolicy": "flux-system:jobmatch-api-dev"}
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
            - name: LLM_PROVIDER
              value: "auto"
            - name: SKILLS_DIR
              value: "/app/skills"
          volumeMounts:
            - name: skills-volume
              mountPath: /app/skills
      volumes:
        - name: skills-volume
          configMap:
            name: jobmatch-skills
```

---

## 5. Обмеження Kustomize & Автоматизація Синхронізації

Kustomize має вбудоване обмеження безпеки (**Load Restrictors**), яке за замовчуванням забороняє генераторам (`configMapGenerator`, `secretGenerator`) читати файли поза поточною директорією оверлею (наприклад, `../../../app/skills/` поверне помилку безпеки). Оскільки FluxCD виконує Kustomize всередині кластера без можливості відключити це обмеження, ми реалізували наступний підхід:

1. **Локальні копії:** У кожному оверлеї (`dev` та `prod`) створено підпапку `skills/` (`platform/environments/dev/skills/`), яка містить копію файлів з `app/skills/`.
2. **Скрипт синхронізації:** Створено скрипт `scripts/sync-skills.sh`, який автоматично оновлює локальні копії скілів перед комітом:
   ```bash
   ./scripts/sync-skills.sh
   ```
3. **Валідація в CI:** У GitHub Actions додано крок `Verify Skills Sync`, який перевіряє, чи скіли в `platform/environments/*/skills/` ідентичні скілам в `app/skills/`. Якщо розробник забув запустити скрипт синхронізації та зробити коміт, пайплайн завершиться помилкою.

---

## 6. Доступ до AgentGateway ззовні кластера в GCP

Оскільки `abox` розгортає `KinD` у Docker всередині VM, IP-адреса типу `LoadBalancer`, яку надає `cloud-provider-kind` для `AgentGateway`, є локальною для віртуальної машини (наприклад, `172.19.0.2`). 

Щоб зробити API-шлюз доступним із публічного інтернету:

### Варіант А: Прокидання портів через `socat` (Найпростіший для хакатону)
Запустіть утиліту `socat` як фонову службу на VM, щоб перенаправляти вхідний трафік на порти `80` та `443` VM на IP-адресу LoadBalancer кластера:
```bash
# Отримайте IP LoadBalancer AgentGateway
GATEWAY_IP=$(kubectl get svc -n agentgateway-system agentgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Запустіть перенаправлення трафіку
sudo apt-get install -y socat
nohup sudo socat TCP-LISTEN:80,fork,reuseaddr TCP:$GATEWAY_IP:80 > /dev/null 2>&1 &
nohup sudo socat TCP-LISTEN:443,fork,reuseaddr TCP:$GATEWAY_IP:443 > /dev/null 2>&1 &
```

### Варіант Б: Nginx як Reverse Proxy на VM
Встановіть Nginx безпосередньо на VM та налаштуйте проксіювання:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://172.18.0.X:80; # Вкажіть IP LoadBalancer AgentGateway
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

