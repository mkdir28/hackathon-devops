# JobMatch Platform — AI-Powered Job Matching Engine

Ласкаво просимо до репозиторію платформи **JobMatch** — інтелектуальної системи підбору вакансій на основі AI-агентів, розробленої для демонстрації передових практик DevOps, SRE, GitOps та безпеки штучного інтелекту (Prompt Security & Evals).

---

## 📂 Структура монорепозиторію

Репозиторій побудований за принципом монорепозиторію з чітким розділенням зон відповідальності:

```
├── app/                      # Контур застосунку
│   ├── src/                  # React/Vite SPA frontend
│   ├── server/               # Node.js Express API & Worker (JobSearchAgent)
│   ├── skills/               # Версіоновані вміння агента (flat markdown)
│   └── prompts/              # Системні промпти та шаблони ролей LLM
├── platform/                 # Контур інфраструктури (GitOps)
│   ├── flux/                 # Налаштування FluxCD
│   │   └── clusters/         # Розділені каталоги конфігурації для кожного кластера
│   │       ├── dev/          # Налаштування Dev-середовища (Namespace jobmatch-dev, гілка dev)
│   │       └── prod/         # Налаштування Prod-середовища (Namespace jobmatch-prod, гілка main)
│   └── helm/                 # Наш Umbrella Helm Chart (Redis, Qdrant)
├── evals/                    # Контур оцінки моделей (Quality Gate)
│   ├── dataset.json          # Золотий набір тест-кейсів (включає тести безпеки)
│   └── run-evals.mjs         # Скрипт запуску LLM-as-a-Judge евалюації
├── doc/                      # Документація проекту
│   ├── ADR.md                # Architectural Decision Records (Рішення)
│   ├── HLD.md                # High-Level Solution Design (Архітектура)
│   ├── cicd.md               # Детальний опис CI/CD & GitOps
│   ├── eval.md               # Документація роботи контуру Evals
│   └── security_implementation_plan.md # Детальний план впровадження контуру безпеки
```

---

## 🚀 Швидкий старт локально

### 1. Передумови (Prerequisites)
Вам знадобиться встановлений **Node.js v20+** та **Docker / Docker Compose**.

### 2. Встановлення залежностей
```bash
# Встановлення залежностей для frontend та backend
npm install
npm install --prefix app/server
```

### 3. Конфігурація змінних середовища
Створіть файл `.env` у каталозі `app/` на основі `.env.example`:
```bash
cp app/.env.example app/.env
```
Відкрийте `app/.env` та додайте хоча б один API-ключ LLM-провайдера (наприклад, `GEMINI_API_KEY`, `OPENAI_API_KEY` або `ANTHROPIC_API_KEY`).

### 4. Збірка бекенду
Для генерації скомпілованого JavaScript коду бекенду:
```bash
cd app/server
npm run build
```

### 5. Запуск у режимі розробки
```bash
# З кореня репозиторію
npm run dev
```
* **Frontend UI:** http://localhost:5173
* **Backend API Health:** http://localhost:3001/api/health

---

## 🛠️ Docker розгортання
Для запуску всього стеку в Docker контейнерах локально:
```bash
cd app
docker compose up --build
```
Веб-інтерфейс буде доступний за адресою http://localhost:8080.

---

## 🧪 Запуск Evals (Quality Gate)
Контур Evals оцінює якість підбору вакансій та генерації супровідних листів за допомогою паттерну LLM-as-a-Judge.

```bash
# Перехід до каталогу evals та запуск
cd evals
npm install
npm test
```
Скрипт оцінить тестові кейси з `dataset.json`, використовуючи метрики:
* **Relevance** (Релевантність)
* **Tone** (Тональність листа)
* **Hallucination-free** (Відсутність галюцинацій)

*Примітка: У CI/CD пайплайні крок евалюації запускається **умовно** — тільки на гілці `main` при злитті змін (Pull Request) та за умови зміни файлів промптів. Якщо середній бал падає нижче `4.2/5.0` або виявляється вразливість, пайплайн завершується помилкою.*

---

## 🛡️ Контур безпеки (Security Controls)
* **Маскування PII:** Конфіденційні дані користувача (email, телефони, посилання) автоматично видаляються з резюме локально перед передачею в хмару (може виконуватися на рівні бекенду або на рівні `agentgateway` з `abox` за допомогою Guardrails).
* **Prompt Injection Shield:** XML-тегування відокремлює інструкції системи від даних користувача. Регресійний набір тестів перевіряє стійкість до ін'єкцій.
* **Secrets Management:** Усі ключі вилучено з коду та Git, вони доставляються в Kubernetes через K8s Secrets / External Secrets Operator. На рівні `agentgateway` налаштовано проксіювання ключів (`secretRef`).
* **CI/CD Security Gates:** До пайплайну інтегровано перевірку **Gitleaks** для блокування коммітів із захардкодженими секретами та лінтер-сканер промптів (`check-skills-security.mjs`).

---

## 📖 Детальні архітектурні документи

* 📑 **[Architectural Decision Records (ADR)](doc/ADR.md)** — Чому саме так побудована система, FinOps аналіз та розрахунки Unit-економіки.
* 📐 **[High-Level Solution Design (HLD)](doc/HLD.md)** — Схеми архітектури, життєвого циклу Агента та діаграми розгортання в Kubernetes.
* 🔄 **[CI/CD & GitOps Guide](doc/cicd.md)** — Детальний опис налаштування FluxCD, тегування образів та автоматичного оновлення релізів.
* 🧪 **[Evaluation Engine Guide](doc/eval.md)** — Опис налаштування контуру Evals, тестових сценаріїв та оцінки LLM-as-a-Judge.
* 🛡️ **[Security Implementation Plan](doc/security_implementation_plan.md)** — Архітектурні схеми та детальний план впровадження захисту від Prompt Injection, маскування PII та External Secrets.
* 🏗️ **[Deployment Infrastructure Guide](doc/deployment_infrastructure.md)** — Стратегія розгортання для всіх середовищ (Dev, Staging, Prod), мережева топологія та забезпечення високої допустимості.
* 🗺️ **[Architecture Implementation Roadmap](doc/roadmap.md)** — Роадмап реалізації цільової архітектури, аналіз розбіжностей MVP та кроки впровадження БД/кешування.