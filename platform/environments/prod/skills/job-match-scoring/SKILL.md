# Job match scoring

> Adapted from [job-search-skills/job-crawler](https://github.com/sameergdogg/job-search-skills/blob/main/job-crawler/SKILL.md) Step 4. Weighted 0–100 scoring for ranking verified listings.

## Match score (0–100)

Compute `score` for each listing using these factors:

| Factor | Weight | Assess |
|--------|--------|--------|
| **Core skill overlap** | 35% | % of role requirements met by CV skills/query; count transferable skills (e.g. K8s ↔ Kubernetes). |
| **Experience level fit** | 20% | Exact level → 100%; one level above → 60%; one level below → 50%; two+ levels off → 20%. |
| **Domain relevance** | 20% | Same domain → 100%; adjacent → 70%; unrelated → 30%. |
| **Requirement gap severity** | 15% | 0 must-have gaps → 100%; 1 minor → 80%; 1 major → 50%; 2+ major → 20%. Major = core tech with no CV evidence. |
| **Growth opportunity** | 10% | Leverages strengths + reasonable stretch → 100%; same skills only → 50%; all-new stack → 30%. |

## Rationale field

In ≤40 words, mention the top 1–2 factors driving the score (not a generic "good fit").

## Honesty

- A 45/100 can still appear if it is the best verified listing — note gaps in `rationale`.
- Do not inflate scores; use the full range.
- Sort `jobs` by `score` descending.

## CV absent

When no CV is uploaded, weight **core skill overlap** from the natural-language query and listing snippet/title only.
