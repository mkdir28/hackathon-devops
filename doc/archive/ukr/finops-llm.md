# FinOps LLM Маршрутизація: Управління Складністю та Собівартістю Запитів

Цей документ описує концепцію та технічні варіанти реалізації динамічної маршрутизації LLM-запитів на основі складності задач (FinOps роутинг) за допомогою `AgentGateway`.

Основна мета — автоматично надсилати прості чи рутинні задачі (наприклад, первинний аналіз збігів резюме з вакансією) на швидкі та дешеві моделі (наприклад, **gemini-2.5-flash-lite** як основну або **gpt-5.4-nano** як резервну), а складні, творчі або синтетичні завдання (наприклад, фінальний аналіз або написання супровідного листа - Cover Letter) — на потужніші моделі (наприклад, **claude-haiku-4-5** як основну або **gemini-3.5-flash** як резервну).

---

## 🏗️ Схема роботи маршрутизації

```mermaid
graph TD
    App[Node.js Backend] -->|1. Request with Metadata x-gateway-task-name| GW[AgentGateway / Envoy]
    GW -->|2. Evaluate HTTPRoute rules| Router{Header match?}
    Router -->|gemini / job_match| Gemini[gemini-backend]
    Router -->|claude / cv_extract| Claude[claude-backend]
    Gemini -->|3. Proxy request| GeminiAPI[Google Gemini API]
    Claude -->|3. Proxy request| ClaudeAPI[Anthropic API]
```

---

## 📋 Вихідний стан: Передача типу задачі в API Бекенді

На рівні внутрішньої бізнес-логіки бекенд **вже визначає** тип завдання і створює запити типу `StructuredGenerateRequest` з відповідним полем `task`:

1. **Для оцінки збігу резюме з вакансіями (легке завдання):**  
   У файлі [synthesize.ts](../app/server/agent/synthesize.ts#L54-L60) викликається метод `generateStructured` із тегом `'job_match'`:
   ```typescript
   const client = getAIClient();
   const result = await client.generateStructured<JobMatchResult>({
     task: 'job_match', // <-- Логічний тип завдання
     systemPrompt: RANK_SYSTEM + skills,
     userPrompt: userBlock,
     jsonSchema: input.jsonSchema,
   });
   ```

2. **Для структурованого розбору CV (складне завдання):**  
   У файлі [llm.ts](../app/server/services/llm.ts#L58-L64) виконується виклик із тегом `'cv_extract'`:
   ```typescript
   const client = getAIClient();
   const output = await client.generateStructured<Record<string, unknown>>({
     task: 'cv_extract', // <-- Логічний тип завдання
     systemPrompt: CV_SYSTEM,
     userPrompt: `CV text:\n\n${text}`,
     jsonSchema: json_schema,
   });
   ```

Хоча бекенд *внутрішньо* володіє цими метаданими в `request.task`, клієнт застосунку **не відправляв** цей тип завдання назовні до `AgentGateway`.

---

## 🛠️ Реалізований підхід: Декларативний роутинг за типом задачі (Variant B)

*Рекомендований підхід для розділення обов'язків (Separation of Concerns).*  
У цьому випадку код застосунку нічого не знає про назви моделей і провайдерів. Застосунок лише маркує логічний тип задачі (`task: 'job_match'` або `task: 'cv_extract'`). Клієнт прокидає цей тип як HTTP-заголовок, а вибір конкретної моделі та бекенду здійснюється суто через Kubernetes/Flux декларативні маніфести.

### Крок 1: Передача типу задачі через HTTP-заголовок у коді
Щоб передати тип завдання на шлюз безпеки, ми додаємо HTTP-заголовок `x-gateway-task-name` у параметри запиту клієнта [openai.ts](../app/server/ai/providers/openai.ts#L31-L47):

```typescript
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: request.userPrompt },
      ],
      response_format: request.jsonSchema
        ? {
            type: 'json_schema',
            json_schema: {
              name: `${request.task}_response`,
              strict: false,
              schema: request.jsonSchema,
            },
          }
        : { type: 'json_object' },
    }, {
      headers: {
        'x-gateway-task-name': request.task, // <-- Прокидаємо тип задачі на шлюз
      }
    });
```

Усі інші провайдери (як-от Claude та Gemini за наявності `GATEWAY_URL`) автоматично делегують свої виклики цьому `OpenAIProvider`, тому вони також успадковують цей заголовок.

---

### Крок 2: Оновлення правил роутингу в HTTPRoute
У файлі [agentgateway-route.yaml](../platform/flux/clusters/dev/apps/jobmatch/agentgateway-route.yaml) ми розподіляємо трафік залежно від заголовка `x-gateway-task-name`:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: llm-router
  namespace: agentgateway-system
spec:
  parentRefs:
    - name: agentgateway-external
  rules:
    # 1. Задачі матчингу (job_match) спрямовуються на дешевий Gemini
    - matches:
        - headers:
            - name: x-gateway-task-name
              value: "job_match"
      backendRefs:
        - group: agentgateway.dev
          kind: AgentgatewayBackend
          name: llm-for-simple-task
          port: 443
    # 2. Complex tasks and by default -> expensive model
    - backendRefs:
        - group: agentgateway.dev
          kind: AgentgatewayBackend
          name: llm-for-complex-task
          port: 443
```

---

## ⚖️ Переваги Варіанту Б (Декларативний роутинг)

1. **Гнучкість FinOps без релізу коду:** Якщо завтра вартість Gemini знизиться чи вийде нова дешева модель Claude Haiku, SRE-інженер може оновити маніфести `AgentgatewayBackend` та перенаправити задачу `job_match` на нову модель суто в Git, без потреби перебудовувати Docker-образ чи деплоїти бекенд.
2. **Єдине джерело істини:** Співвідношення типу завдання до вартості та провайдера зберігається у конфігурації платформи, а не розсіюється по коду різних сервісів.
3. **Простота локальної розробки:** Розробник на локальній машині просто маркує завдання за їх призначенням, а шлюз локально сам вирішує, куди їх пересилати (наприклад, на локальний `mock-llm`).

---

## 🎯 Рекомендації щодо вибору моделей для задач (FinOps-оптимізація)

Для оптимізації вартості (FinOps) та якості роботи системи (Quality of Service) найкраще підбирати моделі на основі двох критеріїв: **складності міркувань (Reasoning)** та **об'єму вхідного тексту (Context/Tokens)**.

### 1. Задача розбору резюме (`cv_extract`)
* **Особливості:** Точний розбір неструктурованого тексту резюме, вилучення досвіду, освіти й навичок та гарантоване вкладення у складну валідну JSON-схему.
* **Рекомендована модель:** **claude-haiku-4-5** (Основна) або **gemini-3.5-flash** (Резервна).
  * *Обґрунтування:* `claude-haiku-4-5` демонструє чудові аналітичні здібності для вилучення сутностей з тексту резюме за дуже вигідною ціною ($1.00 / 1M input), що робить її ідеальною основною моделлю. `gemini-3.5-flash` є надійним резервним варіантом із великим контекстним вікном.

### 2. Задача оцінки та ранжування вакансій (`job_match`)
* **Особливості:** Розрахунок збігів 10+ вакансій із профілем користувача та написання короткого обґрунтування. Потребує високої швидкості (Latency) та обробки великих об'ємів тексту (великі вхідні токени).
* **Рекомендована модель:** **gemini-2.5-flash-lite** (Основна) або **gpt-5.4-nano** (Резервна).
  * *Обґрунтування:* Вхідні токени `gemini-2.5-flash-lite` коштують усього $0.075 за 1M токенів. Це забезпечує мінімальну вартість для паралельного збору й оцінки вакансій. `gpt-5.4-nano` виступає як дешевий резерв від OpenAI.

---

## 🔍 Як перевірити, що рутінг працює коректно?

Для перевірки коректності роботи FinOps-маршрутизації на основі HTTP-заголовока `x-gateway-task-name`, можна використовувати ручне тестування за допомогою `curl` прямо в Kubernetes-кластері.

### Крок 1: Запуск тестового пода
Запустіть тимчасовий под із клієнтом `curl` у просторі імен `jobmatch-dev`:
```bash
kubectl run curl-test -n jobmatch-dev --image=curlimages/curl --rm -it --restart=Never -- sh
```

### Крок 2: Відправка запитів з різними заголовками завдань
Виконайте всередині тестового пода наступні запити до `AgentGateway`:

1. **Тестування маршруту для задачі `job_match` (має бути направлено до `gemini-backend`):**
   ```bash
   curl -s -X POST "http://agentgateway-external.agentgateway-system.svc.cluster.local/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "x-gateway-task-name: job_match" \
     -d '{"messages":[{"role":"user","content":"Compare this resume and job descriptions."}]}'
   ```

2. **Тестування маршруту для задачі `cv_extract` (має бути направлено до `claude-backend`):**
   ```bash
   curl -s -X POST "http://agentgateway-external.agentgateway-system.svc.cluster.local/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "x-gateway-task-name: cv_extract" \
     -d '{"messages":[{"role":"user","content":"Extract skills from the resume text."}]}'
   ```

### Крок 3: Перевірка логів mock-сервера
В окремому терміналі відкрийте логи пода `mock-llm`, щоб переконатися, що шлюз Envoy перенаправив запити на правильні бекенди і замінив моделі відповідно до політик:
```bash
kubectl logs -n jobmatch-dev deployments/mock-llm -f
```

* **Для запиту `job_match`** у логах `mock-llm` ви побачите запит із моделлю **`gemini-2.5-flash-lite`** (та з відповідними заголовками авторизації Gemini).
* **Для запиту `cv_extract`** у логах `mock-llm` ви побачите запит із моделлю **`claude-haiku-4-5`** (та з відповідними заголовками авторизації Claude).


