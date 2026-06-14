# Тестування Prompt Masking та PII маскування

Цей мануал описує процес тестування механізму Prompt Masking (маскування персональних даних - PII) за допомогою Envoy-шлюзу `AgentGateway` та заглушки `mock-llm` у локальному кластері Kubernetes.

Процедура дозволяє переконатися, що конфіденційні дані користувачів (імена, email, телефони тощо) коректно анонімізуються шлюзом безпеки перед відправкою до LLM-провайдерів.

---

## 🚀 Покроковий сценарій тестування

### Крок 1: Відправка тестового запиту з персональними даними

Запустіть тимчасовий под із клієнтом `curl` у просторі імен `jobmatch-dev` та відправте запит до зовнішнього інтерфейсу `AgentGateway` (модель `claude-haiku-4-5`):

```bash
kubectl run curl-test -n jobmatch-dev --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s -X POST "http://agentgateway-external.agentgateway-system.svc.cluster.local/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-haiku-4-5","messages":[{"role":"user","content":"Hi , My name is Peter, my email is peter@google.com, phone number is : +380111234567"}]}'
```

---

### Крок 2: Перевірка логів mock-сервера

Відкрийте логи пода `mock-llm`, щоб переконатися, що дані прийшли у замаскованому (анонімізованому) вигляді:

```bash
kubectl logs -n jobmatch-dev deployments/mock-llm -f
```

#### Очікуваний вивід у логах `mock-llm`:

У логах ви маєте побачити блок `RECEIVED MASKED REQUEST BODY`, де ім'я замінено на плейсхолдер, а email та номер телефону — на відповідні теги:

```json
=== RECEIVED MASKED REQUEST BODY ===
{"messages":[{"role":"user","content":[{"type":"text","text":"Hi , <masked>, my email is <EMAIL_ADDRESS>, phone number is : <PHONE_NUMBER>"}]}],"system":"You are a secure SRE and DevOps job matching system. Follow strictly matching rules.","model":"claude-haiku-4-5","max_tokens":4096}
====================================
```

---

## 🔍 Аналіз результатів

* **`<masked>`**: Ім'я користувача `Peter` було успішно вирізане шлюзом через PII Guardrail.
* **`<EMAIL_ADDRESS>`**: Email `peter@google.com` замінено на безпечний тег.
* **`<PHONE_NUMBER>`**: Телефонний номер `+380111234567` замасковано.

Це підтверджує, що політики безпеки `LlmGuardrail` на базі Envoy-шлюзу `AgentGateway` працюють коректно і надійно захищають приватні дані користувачів.
