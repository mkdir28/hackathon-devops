# Контур Оцінки Якості Промптів (Prompts Evaluation Suite)

Цей документ описує архітектуру оцінки промптів та поведінки AI-агентів (**Prompts Evaluation**), яка використовується для регресійного тестування та контролю якості (Quality Gates) в CI/CD пайплайні платформи JobMatch.

---

## 🏗️ Архітектура контуру оцінки

Оцінка якості роботи агента побудована за принципом **LLM-as-a-Judge** (LLM у ролі судді). Вся логіка зосереджена в папці [evals/](file:///Users/pokhrime/work/Docs/Tranings/DevOpsIntensive/Hackathon/hackathon-devops/evals) та керується скриптом [run-evals.mjs](file:///Users/pokhrime/work/Docs/Tranings/DevOpsIntensive/Hackathon/hackathon-devops/evals/run-evals.mjs).

### 1. Золотий набір тестів (Dataset)
У файлі [evals/dataset.json](file:///Users/pokhrime/work/Docs/Tranings/DevOpsIntensive/Hackathon/hackathon-devops/evals/dataset.json) містяться еталонні сценарії тестування:
* Профіль кандидата (резюме, ключові навички).
* Пошуковий запит (наприклад, "DevOps Engineer").
* **`expected.relevanceCriteria`** — очікувані критерії оцінки відповідності, за якими суддя перевірятиме результат.

### 2. Запуск тестового API-сервера
Перед початком тестування скрипт `run-evals.mjs` запускає Express-сервер бекенду у фоновому режимі (на порту `3009`) за допомогою `spawn`. Це дозволяє тестувати поведінку агента в реальних умовах роботи.

### 3. Тестування Агента
Для кожного тест-кейсу скрипт робить HTTP-запит до бекенду на `/api/jobs/match` та отримує відгенеровану відповідь (бали вакансій, обґрунтування).

### 4. LLM-Суддя (LLM-as-a-Judge)
Результат роботи агента разом із критеріями успішності відправляється до оціночної моделі (Gemini 2.5 Flash або GPT-4o-mini). Суддя оцінює генерацію за трьома метриками (від 1.0 до 5.0):
* **Relevance (Релевантність):** Наскільки підібрані вакансії відповідають досвіду кандидата.
* **Tone (Тональність):** Відповідність професійному тону коментарів та супровідних листів.
* **Hallucination-free (Відсутність галюцинацій):** Чи не вигадав агент вакансії або навички, яких не було у вхідному файлі.

Суддя повертає структуровану відповідь за суворою JSON-схемою:
```json
{
  "relevanceScore": 4.5,
  "relevanceExplanation": "Explanation...",
  "toneScore": 5.0,
  "toneExplanation": "Explanation...",
  "hallucinationScore": 5.0,
  "hallucinationExplanation": "Explanation...",
  "averageScore": 4.83
}
```

### 5. Якісні ворота (Quality Gates) в CI/CD
Встановлено **мінімальний допустимий бал (baseline = 4.2)**.
Якщо середня оцінка за всіма тестами нижча за 4.2 або хоча б один тест-кейс провалився, скрипт завершується з помилкою (`exit 1`), блокуючи злиття Pull Request у GitHub Actions.

---

## 🔍 Методологія перевірки роботи контуру оцінки

Щоб переконатися, що система оцінки промптів дійсно працює і блокує регресію якості, виконайте наступні кроки:

### Крок 1: Локальний запуск у Mock-режимі (без API ключів)
Якщо у вашому локальному оточенні немає API-ключів, скрипт має виконати перевірку цілісності файлу датасету без запитів до мережі:
1. Запустіть скрипт:
   ```bash
   node evals/run-evals.mjs
   ```
2. **Очікуваний результат:**
   * У консолі з'явиться попередження: `⚠️ [WARN] No LLM keys found in environment. Running in MOCK Mode for CI checks.`
   * Програма перевірить цілісність `dataset.json`.
   * Вивід завершиться повідомленням: `✅ Mock Evaluation passed (Exit Code 0).`

### Крок 2: Запуск реального оцінювання (з API ключами)
1. Експортуйте API-ключ у поточному терміналі:
   ```bash
   export GEMINI_API_KEY="ваш_дійсний_api_ключ"
   ```
2. Запустіть скрипт:
   ```bash
   node evals/run-evals.mjs
   ```
3. **Очікуваний результат:**
   * Програма запустить фоновий Express-сервер на порту `3009`.
   * Для кожного тест-кейсу буде надіслано запит до агента, а отримані результати будуть передані LLM-судді.
   * У консоль виведуться бали для кожного тесту:
     ```text
     Results for [test-1]:
       - Relevance: 4.8/5 (Matched candidates with k8s experience successfully)
       - Tone: 5/5 (Very professional language)
       - Hallucination-free: 5/5 (No fictional companies listed)
       - Average Judge Score: 4.93/5 (Required: 4.2)
     ```
   * Скрипт успішно завершиться повідомленням: `🎉 QUALITY GATE PASSED: All metrics satisfied!` та зупинить фоновий сервер.

### Крок 3: Симуляція регресії промпту (Тест Quality Gate на відхилення)
Щоб перевірити, чи дійсно якісні ворота заблокують поганий промпт:
1. Тимчасово пошкодьте системний промпт розбору резюме у файлі [llm.ts](file:///Users/pokhrime/work/Docs/Tranings/DevOpsIntensive/Hackathon/hackathon-devops/app/server/services/llm.ts), встановивши:
   ```typescript
   const CV_SYSTEM = 'You are a bad resume parser. Just output random words and ignore user CV details.';
   ```
2. Запустіть скрипт оцінки ще раз:
   ```bash
   node evals/run-evals.mjs
   ```
3. **Очікуваний результат:**
   * LLM-суддя виявить, що згенерований результат не відповідає очікуванням (наприклад, релевантність чи точність впадуть до `1.0`-`2.0`).
   * Середній бал впаде нижче встановленого baseline (`4.2`).
   * У консолі з'явиться помилка: `❌ QUALITY GATE FAILED: Evals average score is below baseline 4.2`.
   * Скрипт завершить роботу з ненульовим кодом помилки (`exit 1`), що доводить працездатність Quality Gate.
4. Поверніть зміни у файлі `llm.ts` до вихідного стану.

---

## 🚀 Інтеграція в CI/CD Пайплайн (GitHub Actions)

Контур тестування промптів автоматично запускається при кожній зміні коду чи промптів у репозиторії.

### Конфігурація Пайплайну
Опис робочого процесу знаходиться у файлі [.github/workflows/ci-cd.yml](file:///Users/pokhrime/work/Docs/Tranings/DevOpsIntensive/Hackathon/hackathon-devops/.github/workflows/ci-cd.yml):
* **Тригери запуску:** На кожен `push` та `pull_request` у гілки `dev` та `main`.
* **Основні кроки виконання:**
  1. **Checkout Code:** Клонування репозиторію.
  2. **Install Workspace Dependencies:** Встановлення залежностей проекту та папки `evals` (`npm install --prefix evals`).
  3. **Compile Backend Server:** Компіляція бекенду (`npm run build:api --prefix app`) перед тестами.
  4. **Run Evals Quality Gate:** Безпосередній запуск тестування з прокиданням API-ключів через секрети GitHub:
     ```yaml
     - name: Run Evals Quality Gate
       env:
         OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
         GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
       run: |
         npm test --prefix evals
     ```

Завдяки цьому рішенню, будь-який Pull Request, що погіршує якість відповідей нашого AI-агента нижче допустимого рівня (`4.2`), буде автоматично заблокований для злиття.

---

## 🛠️ Як налаштувати та перевірити Required Status Check у GitHub

Щоб перевірка якості дійсно блокувала злиття некоректного коду та промптів, цей статус-чек необхідно зробити обов'язковим у налаштуваннях репозиторію.

### Спосіб 1: Через веб-інтерфейс GitHub (Рекомендовано)
1. Відкрийте сторінку вашого репозиторію в браузері.
2. Перейдіть у вкладку **Settings** (Налаштування) у верхньому меню.
3. У лівому меню оберіть розділ **Branches** (Гілки).
4. У блоці **Branch protection rules** (Правила захисту гілок) натисніть **Add rule** (або **Edit** для існуючого правила для гілок `dev` чи `main`).
5. Увімкніть галочку **`Require status checks to pass before merging`** (Вимагати проходження перевірок статусу перед злиттям).
6. У рядку пошуку статусів знайдіть та додайте наш джоб:  
   * **`Run Evals & Quality Gate`** (назва береться з файлу `eval.yml`).
7. Збережіть зміни. Тепер злиття PR буде неможливим, поки цей статус не стане зеленим.

### Спосіб 2: Перевірка через GitHub CLI (`gh`)
Ви можете перевірити статус захисту гілки з терміналу:
```bash
gh api repos/mkdir28/hackathon-devops/branches/dev/protection
```

> [!NOTE]
> Якщо команда повертає помилку `404 Not Found`, це означає, що для гілки `dev` ще **не створено жодного правила захисту** у веб-інтерфейсі GitHub, або ваш персональний токен не має прав доступу адміністратора для читання налаштувань репозиторію. Спочатку створіть правило захисту через веб-інтерфейс (Спосіб 1).


