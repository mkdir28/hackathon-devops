# Job search matching

> Agentic search across 80+ job boards (by country), then LLM ranking on verified URLs only.

## Behavior

- Boards are selected from `server/data/job-boards.json` (see `global-job-boards` skill).
- Tools `fetch_job_board` and `web_search_jobs` collect listings before the LLM runs.
- Return only jobs with a real `applyUrl` from tool output (HTTP/HTTPS listing page).
- Ukraine: prioritize DOU.ua, Work.ua, Djinni; global: LinkedIn, Indeed, Glassdoor, etc.
- Sort by `score` descending (0–100).
- Keep `rationale` under 40 words.
- Include 2–5 `tags` per job.
- Provide 3–5 follow-up `suggestions` as short search queries.

## Salary and logos

- `salaryEstimate`: monthly USD range when plausible; note it is an estimate.
- `logoUrl`: prefer `https://logo.clearbit.com/{domain}` when a company domain is known.
