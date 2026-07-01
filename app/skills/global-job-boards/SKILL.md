# Global job boards catalog

> Use the server catalog (`server/data/job-boards.json`, 79 boards; source: `src/lib/jobWebsites.ts`) to pick sites by country before any search.

## Selection rules

1. Resolve `countryCode` from the user request (e.g. `UA`, `US`, `WORLDWIDE`, `REMOTE`).
2. Include boards where `countries` contains that code, `GLOBAL`, `WORLDWIDE`, or `REMOTE` when relevant.
3. Sort by `priority` descending; run at most 12 boards per search.
4. Never invent listings — only return jobs discovered by agent tools (`fetch_job_board`, `web_search_jobs`).

## Regions in catalog

| Region | Example boards |
|--------|----------------|
| Ukraine | DOU.ua, Work.ua, Robota.ua, Djinni |
| United States | Indeed, LinkedIn, Glassdoor, Dice, ZipRecruiter |
| United Kingdom | Indeed UK, Reed, Totaljobs |
| Germany | Indeed DE, StepStone, XING |
| Poland | Pracuj.pl, Just Join IT, No Fluff Jobs |
| Global / Remote | LinkedIn, Remote OK, Wellfound, Himalayas |

Full list is loaded at runtime from JSON; the agent injects the country-specific subset into the LLM ranking prompt.
...smth....