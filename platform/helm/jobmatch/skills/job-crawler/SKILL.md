# Job crawler (company careers & ATS)

> Adapted from [job-search-skills/job-crawler](https://github.com/sameergdogg/job-search-skills/blob/main/job-crawler/SKILL.md). Crawl company career pages via public ATS APIs when possible; filter and rank roles against the candidate CV.

## When this applies

Use when listings come from company career sites or ATS-hosted boards (Greenhouse, Lever, Ashby, etc.), or when the user's query names a specific employer.

## ATS detection

Prefer public JSON APIs over HTML scraping:

| Platform | Career URL pattern | API |
|----------|-------------------|-----|
| **Lever** | `jobs.lever.co/{company}` | `https://api.lever.co/v0/postings/{company}?mode=json` |
| **Greenhouse** | `boards.greenhouse.io/{company}` | `https://api.greenhouse.io/v1/boards/{company}/jobs?content=true` |
| **Ashby** | `jobs.ashbyhq.com/{company}` | `https://api.ashbyhq.com/posting-api/job-board/{company}?includeCompensation=true` |
| **Recruitee** | `{company}.recruitee.com` | `https://{company}.recruitee.com/api/offers` |
| **Workable** | `apply.workable.com/{company}` | `https://apply.workable.com/api/v1/widget/accounts/{company}` |

If the URL is on the company domain, look for embedded Lever/Greenhouse/Ashby iframes or script references before falling back to HTML fetch.

## Filter before ranking

1. **Department** — prefer Engineering, Platform, Infrastructure, Product Development, SRE, DevOps.
2. **Location** — respect country/remote from the user request; remote-eligible roles are OK.
3. **Tiered title matching** (do not match titles only):
   - **Tier 1:** Direct title match to the user's query or primary specialty.
   - **Tier 2:** Adjacent titles — read the description; titles are misleading.
   - **Tier 3:** Stretch roles only if Tier 1–2 are sparse.
4. **Deduplicate** — same role in multiple locations = one entry; pick the level closest to the user's seniority.

## Output rules (this app)

- Every job must keep a verified `applyUrl` from tool output — never invent URLs.
- Prefer 8–15 candidates before deep analysis; rank up to **10** for the JSON response.
- If nothing fits well, say so honestly (e.g. best match ~45/100).

## Hard filters (from user prompt / CV)

- Exclude roles that violate stated location constraints.
- Flag (do not auto-exclude) roles where excluded keywords appear only as "nice to have."
