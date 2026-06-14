ЗАВДАННЯ 
Хакатон «Scout: Job Searcher AI Assistant»

Стартап Scout щойно підняв seed-раунд на AI-асистенті для пошуку роботи: він читає CV, матчить вакансії й пише супровідні листи. Демо інвесторам пройшло блискуче: на ноутбуці засновника, з одним зашитим API-ключем і промптом у коментарі коду.

Тепер на горизонті перші 5000 користувачів, юрист нервово питає про GDPR, а CFO вперше побачив рахунок від LLM-провайдера.

Засновники наймають вас. Ви DevOps/Platform-команда. Scout застосунок працює (більш-менш). Ваша робота — перетворити прототип на систему, яка не розвалиться під навантаженням, не зіллє чужі CV і не витратить увесь бюджет за квартал.

Мета 

Побудувати та продемонструвати прототип повного інженерного контура (Harness) навколо агентного AI-застосунку: від коміту до прода, з evals у пайплайні, захистом персональних даних і собівартістю.

Що ми розробляємо

Стартап запускає AI-асистента для пошуку роботи. Фіча виглядає простою,  але складна інженерна система стоїть навколо неї. Прототип застосунку https://github.com/GregoryKoshelenko/devops-sre-job-match-app-example 

Ваше завдання: побудувати все, що робить його production-ready, безпечним і економічно життєздатним. 

1. SDLC та "як збирати"

Monorepo з чітким поділом app/ (worker + API), platform/ (Flux/Helm/Kustomize, інфра), evals/ (про це нижче).
CI на GitHub Actions / GitLab: lint → unit → build → push образу. 
CD через Flux (ArgoCD): merge до main рендерить маніфести, контролер реконсилює кластер. 
Реліз процес: dev → staging → prod (наприклад, через окремі overlays). 
System prompts, SKILL.md, model config лежать у git, версіонуються, проходять той самий PR-флоу і ті самі evals, що й код. 
Зміна промпту = PR із прогоном eval-сюїти. 
2. Harness Engineering

Memory: профіль кандидата (CV, навички, історія діалогу) + кеш вакансій: Vector store для семантичного матчингу
Skill: SKILL.md як декларація вмінь (search-jobs, tailor-cv, draft-cover-letter). Кожен skill — окремо тестований і оцінений (evaluated).
Приклад: https://skilsl.md 
Protocols: MCP-сервери як інструменти (job boards, interviews..). 
3. Тестування: стандартні unit/integration, тестуємо що агент правильно формує запити, парсить tool-calls, обробляє помилки/retry/timeout та evals. 

4. Eval-suite під evals/ із кейсами:

 дано CV + набір вакансій → очікуваний матчинг; дано вакансію → якість cover letter по осях релевантність / тон / відсутність галюцинацій. 
Скоринг через LLM-as-judge проти expected.md. Gate в CI: PR не мерджиться, якщо eval-score впав нижче baseline. 
Приклад https://www.solo.io/press-releases/introducing-new-agentic-open-source-project-agentevals 
Розробляємо regression-набір на prompt injection і на витік PII у відповідях - це одночасно eval і security control.
5. Security

Prompt injection: вакансії та CV приходять ззовні, в них може бути "ignore previous instructions". Ізоляція даних від інструкцій, валідація tool call, allow-list дій агента.
PII / data governance: мінімізація, що ви взагалі шлете в LLM-провайдера та відповідаєте користувачу.
Приклад Prompt Enrichment https://agentgateway.dev/docs/kubernetes/latest/tutorials/prompt-enrichment/
Secrets: AgentGateway, External Secrets Operator або Vault/SealedSecrets, ніяких ключів у git.
Приклад https://agentgateway.dev/docs/kubernetes/main/llm/api-keys/
Supply chain: SBOM, signed images (cosign), pinned digests. Класичний SRE-гігієна. (опціонально)
Output guardrails: фільтр на витік системного промпта і на токсичність/дискримінацію в job-matching (юридично гострий момент для рекрутингу).
Приклад Prompt Guards https://agentgateway.dev/docs/kubernetes/latest/llm/guardrails/multi-layer/
6. Хостинг та AI-провайдер

Не обираємо одного. Пропонуємо альтернативи

Приклад аналізу:

Claude Haiku 4.5 коштує $1/$5, Sonnet 4.6 — $3/$15, Opus 4.7 — $5/$25 за мільйон токенів. GPT-5.4 — $2.50/$15, GPT-5.5 — $5/$30. Gemini 3 Flash — $0.50/$3, Gemini 3.1 Pro — $2/$12, Flash-Lite — $0.10–0.25 input. 

7. FinOps: робочий розрахунок

Оцінюємо сценарій: 

5 000 активних користувачів/міс, ~20 взаємодій кожен. 
Середня: ~3K input (CV + вакансії + контекст), ~800 output. 
Разом ~300M input + 80M output на місяць.
Вартість навантаження на різних моделях. 

Вартість на одного активного користувача (cost-per-active-user) як головна unit-метрика

Завдання хакатону

1. SDLC 

Базова інфраструктура може бути розгорнута за допомогою GitHub Codespaces та Agentic Sandbox репозиторію: https://github.com/den-vasyliev/abox  

2. Harness Engineering: архітектура агента (Model + Harness): 

Memory: розгорнути document agent https://kagent.dev/docs/kagent/examples/documentation 

Skills: налаштувати кастомні skills для роботи з резюме

Automation: налаштувати автоматизацію розгортання оновлених skills для агента на середовище

3. Evals: eval-suit із метриками якості (relevance / tone / hallucinations), gate у CI - налаштувати review та оцінку внесених змін для skills

4. Security: prompt injection, governance персональних даних (CV = PII), secrets management - Налаштувати перевірку skills на безпекову складову

5. Hosting & AI Provider: обґрунтований вибір хостингу й LLM-провайдера (бажано provider-agnostic).

6. FinOps: собівартість на активного користувача + важелі оптимізації (routing, caching, batch).

Критерії успіху

Журі оцінює не якість матчингу вакансій, а зрілість інженерного контуру: 

SDLC. Чи відбувається автоматично деплой: автоматизований build/test/deploy, інфра й промпти як версіонований код.
Evals. Чи якість вимірювана (relevance / tone / hallucinations) і зроблена gate у CI.
Security. Захист від prompt injection, governance CV як PII, secrets поза git, guardrails.
FinOps. Чи команда знає cost-per-active-user у реальному часі і має важелі для routing, caching та cost anomalies
Зверніть увагу - це змагання платформ, а не prompt-інженерів.

Подання: Система повинна бути представлена у вигляді репозиторію GitHub. Репозиторій повинен містити наступне:

Файл ADR (Architectural Decision Records) — обґрунтований вибір дизайну програмного забезпечення, який відповідає функціональним або нефункціональним вимогам, що є важливими з архітектурної точки зору.
Файл HLD (High-Level Solution Design) — що пояснює архітектуру, яка буде використана для розробки системи. Архітектурна діаграма надає огляд всієї системи, визначаючи основні компоненти, які будуть розроблені для продукту, та їхні інтерфейси.
Файл README з описом системи.
Файли демо застосунку
Код системи