# Job search planning prompt (template)

Use while running active job searches (this app or elsewhere). Replace all `{{PLACEHOLDERS}}` before sending to an LLM.

---

I'm searching for {{TARGET_ROLE}} roles in {{COUNTRY}} (preferred: {{CITY}}, {{WORK_MODE}}).

**Experience:** {{SENIORITY}} · {{YEARS_EXPERIENCE}} years · core stack: {{PRIMARY_STACK}}

**Salary target:** ${{SALARY_MIN}} – ${{SALARY_MAX}} / month (USD, {{SALARY_NOTE}})

**Timeline:** start by {{TARGET_START_DATE}} · can interview {{INTERVIEW_AVAILABILITY}}

I'm targeting employers like:

• {{COMPANY_TYPE_1}} — example careers page: {{CAREERS_URL_1}}

• {{COMPANY_TYPE_2}} — example careers page: {{CAREERS_URL_2}}

• {{COMPANY_TYPE_3}} — example careers page: {{CAREERS_URL_3}}

**Search query I'm using in JobMatch (or LinkedIn/Indeed):**
```
{{JOB_SEARCH_QUERY}}
```

**Optional CV summary:**
```
{{CV_SUMMARY_OR_PASTE}}
```

---

After analyzing my profile and these targets, build:

## 1. Job Search Action Tracker (Google Doc)

Forward-looking pipeline planner. Include:

- **Weekly rhythm** — applications per week (target: {{APPLICATIONS_PER_WEEK}}), outreach, interview prep hours
- **Search variants** — {{NUM_QUERY_VARIANTS}} refined queries to run (title synonyms, seniority levels, remote/hybrid filters)
- **Board priority** — which sites to check first for {{COUNTRY}} (LinkedIn, Indeed, local boards, company pages)
- **Skill gaps vs. live postings** — patterns from recent {{TARGET_ROLE}} JDs; projects or certs to close gaps in {{GAP_TIMELINE_WEEKS}} weeks
- **Networking** — {{NUM_NETWORKING_TARGETS}} warm-intro targets, recruiters, or communities; message templates (short)
- **Milestones** — week-by-week through {{SEARCH_END_DATE}} (offer target)

Tight spacing, scannable, built for weekly review every {{REVIEW_DAY}}.

## 2. Application & Evidence Log (Excel)

Backward-looking tracker. Sheets/columns:

- **Applications** — company, role, date applied, source, apply URL, status, follow-up date, contact, notes
- **Postings mined** — title, company, must-have skills extracted, salary range if listed, match score (your estimate)
- **Interview prep** — company, stage, questions to ask, stories (STAR), research links
- **Outcomes** — rejections (reason if known), offers, negotiation notes
- **Resume variants** — version name, target role, key bullets changed, date sent

Use {{METRIC_PLACEHOLDER}} where numbers aren't known yet (e.g. response rate X%, interviews Y).

## 3. Ranked search strategy for JobMatch app

Suggest:

- Best **natural-language query** for the app search box (one paragraph)
- **Country code** to select: {{COUNTRY}}
- **Time range** preference: {{TIME_RANGE}} (e.g. past 2 weeks / 2 months / all)
- **Salary slider** suggestion: min {{SALARY_MIN}} max {{SALARY_MAX}}
- **3 follow-up searches** after the first result set (copy-paste ready)

## 4. This week's top 5 actions

Numbered list, each doable in under 2 hours.

---

**Latest job matches (optional paste from app results):**

```
{{PASTE_JOB_RESULTS_HERE}}
```
