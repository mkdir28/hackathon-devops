/**
 * Job board catalog for UI copy and documentation.
 * Server agent uses `server/data/job-boards.json` (same sites, agent fields).
 * Country codes align with `COUNTRIES` in `./countries.ts`.
 */
export interface JobWebsite {
  id: string;
  name: string;
  url: string;
  domain: string;
  /** ISO-style codes: WORLDWIDE, REMOTE, UA, US, GB, … */
  countries: string[];
}

export const JOB_WEBSITES: readonly JobWebsite[] = [
  // Global / remote
  { id: 'linkedin', name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', domain: 'linkedin.com', countries: ['WORLDWIDE', 'REMOTE', 'US', 'GB', 'DE', 'FR', 'NL', 'CA', 'AU', 'UA', 'PL', 'IN', 'SG', 'JP', 'BR', 'IL', 'IE', 'ES', 'IT', 'SE', 'CH', 'KR', 'AE'] },
  { id: 'indeed-us', name: 'Indeed US', url: 'https://www.indeed.com', domain: 'indeed.com', countries: ['WORLDWIDE', 'REMOTE', 'US'] },
  { id: 'glassdoor', name: 'Glassdoor', url: 'https://www.glassdoor.com/Job', domain: 'glassdoor.com', countries: ['WORLDWIDE', 'REMOTE', 'US', 'GB', 'DE', 'FR', 'CA', 'AU'] },
  { id: 'wellfound', name: 'Wellfound', url: 'https://wellfound.com/jobs', domain: 'wellfound.com', countries: ['WORLDWIDE', 'REMOTE', 'US'] },
  { id: 'remoteok', name: 'Remote OK', url: 'https://remoteok.com', domain: 'remoteok.com', countries: ['WORLDWIDE', 'REMOTE'] },
  { id: 'himalayas', name: 'Himalayas', url: 'https://himalayas.app/jobs', domain: 'himalayas.app', countries: ['WORLDWIDE', 'REMOTE'] },
  { id: 'weworkremotely', name: 'We Work Remotely', url: 'https://weworkremotely.com', domain: 'weworkremotely.com', countries: ['WORLDWIDE', 'REMOTE'] },
  { id: 'flexjobs', name: 'FlexJobs', url: 'https://www.flexjobs.com', domain: 'flexjobs.com', countries: ['REMOTE', 'US', 'WORLDWIDE'] },
  { id: 'otta', name: 'Otta', url: 'https://otta.com', domain: 'otta.com', countries: ['REMOTE', 'GB', 'US', 'DE', 'WORLDWIDE'] },
  { id: 'jooble', name: 'Jooble', url: 'https://jooble.org', domain: 'jooble.org', countries: ['WORLDWIDE', 'REMOTE', 'US', 'GB', 'DE', 'FR', 'UA', 'PL', 'ES', 'IT'] },
  { id: 'talent-com', name: 'Talent.com', url: 'https://www.talent.com', domain: 'talent.com', countries: ['WORLDWIDE', 'REMOTE', 'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'BR'] },
  { id: 'careerjet', name: 'Careerjet', url: 'https://www.careerjet.com', domain: 'careerjet.com', countries: ['WORLDWIDE', 'REMOTE', 'US', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'CA'] },
  { id: 'landing-jobs', name: 'Landing.jobs', url: 'https://landing.jobs', domain: 'landing.jobs', countries: ['WORLDWIDE', 'REMOTE', 'DE', 'FR', 'ES', 'PT', 'GB'] },

  // United States
  { id: 'ziprecruiter', name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com', domain: 'ziprecruiter.com', countries: ['US', 'REMOTE'] },
  { id: 'dice', name: 'Dice', url: 'https://www.dice.com', domain: 'dice.com', countries: ['US', 'REMOTE'] },
  { id: 'monster-us', name: 'Monster', url: 'https://www.monster.com', domain: 'monster.com', countries: ['US'] },
  { id: 'careerbuilder', name: 'CareerBuilder', url: 'https://www.careerbuilder.com', domain: 'careerbuilder.com', countries: ['US'] },
  { id: 'simplyhired', name: 'SimplyHired', url: 'https://www.simplyhired.com', domain: 'simplyhired.com', countries: ['US'] },
  { id: 'snagajob', name: 'Snagajob', url: 'https://www.snagajob.com', domain: 'snagajob.com', countries: ['US'] },
  { id: 'adzuna-us', name: 'Adzuna US', url: 'https://www.adzuna.com', domain: 'adzuna.com', countries: ['US', 'GB', 'AU', 'DE', 'FR'] },

  // Ukraine
  { id: 'dou-ua', name: 'DOU.ua', url: 'https://jobs.dou.ua', domain: 'jobs.dou.ua', countries: ['UA', 'REMOTE'] },
  { id: 'work-ua', name: 'Work.ua', url: 'https://www.work.ua', domain: 'work.ua', countries: ['UA'] },
  { id: 'robota-ua', name: 'Robota.ua', url: 'https://robota.ua', domain: 'robota.ua', countries: ['UA'] },
  { id: 'djinni', name: 'Djinni', url: 'https://djinni.co/jobs', domain: 'djinni.co', countries: ['UA', 'REMOTE', 'PL'] },
  { id: 'grc-ua', name: 'GRC.ua', url: 'https://grc.ua', domain: 'grc.ua', countries: ['UA'] },
  { id: 'jooble-ua', name: 'Jooble Ukraine', url: 'https://ua.jooble.org', domain: 'jooble.org', countries: ['UA'] },

  // United Kingdom
  { id: 'indeed-uk', name: 'Indeed UK', url: 'https://uk.indeed.com', domain: 'uk.indeed.com', countries: ['GB', 'REMOTE'] },
  { id: 'reed-uk', name: 'Reed.co.uk', url: 'https://www.reed.co.uk', domain: 'reed.co.uk', countries: ['GB'] },
  { id: 'totaljobs-uk', name: 'Totaljobs', url: 'https://www.totaljobs.com', domain: 'totaljobs.com', countries: ['GB'] },
  { id: 'cvlibrary-uk', name: 'CV-Library', url: 'https://www.cv-library.co.uk', domain: 'cv-library.co.uk', countries: ['GB'] },
  { id: 'cwjobs', name: 'CWJobs', url: 'https://www.cwjobs.co.uk', domain: 'cwjobs.co.uk', countries: ['GB'] },
  { id: 'technojobs-uk', name: 'Technojobs', url: 'https://www.technojobs.co.uk', domain: 'technojobs.co.uk', countries: ['GB'] },
  { id: 'hackajob', name: 'Hackajob', url: 'https://hackajob.com', domain: 'hackajob.com', countries: ['GB', 'US', 'REMOTE'] },

  // Germany / DACH
  { id: 'indeed-de', name: 'Indeed Germany', url: 'https://de.indeed.com', domain: 'de.indeed.com', countries: ['DE', 'REMOTE'] },
  { id: 'stepstone-de', name: 'StepStone', url: 'https://www.stepstone.de', domain: 'stepstone.de', countries: ['DE'] },
  { id: 'xing-de', name: 'XING Jobs', url: 'https://www.xing.com/jobs', domain: 'xing.com', countries: ['DE', 'CH', 'AT'] },
  { id: 'honeypot', name: 'Honeypot', url: 'https://www.honeypot.io', domain: 'honeypot.io', countries: ['DE', 'NL', 'REMOTE'] },
  { id: 'jobs-ch', name: 'Jobs.ch', url: 'https://www.jobs.ch', domain: 'jobs.ch', countries: ['CH'] },
  { id: 'indeed-ch', name: 'Indeed Switzerland', url: 'https://ch.indeed.com', domain: 'ch.indeed.com', countries: ['CH'] },
  { id: 'jobs-at', name: 'Karriere.at', url: 'https://www.karriere.at', domain: 'karriere.at', countries: ['AT'] },

  // France
  { id: 'indeed-fr', name: 'Indeed France', url: 'https://fr.indeed.com', domain: 'fr.indeed.com', countries: ['FR'] },
  { id: 'wttj-fr', name: 'Welcome to the Jungle', url: 'https://www.welcometothejungle.com', domain: 'welcometothejungle.com', countries: ['FR', 'REMOTE', 'WORLDWIDE'] },
  { id: 'apec-fr', name: 'APEC', url: 'https://www.apec.fr', domain: 'apec.fr', countries: ['FR'] },

  // Netherlands
  { id: 'indeed-nl', name: 'Indeed Netherlands', url: 'https://nl.indeed.com', domain: 'nl.indeed.com', countries: ['NL'] },
  { id: 'nvb-nl', name: 'Nationale Vacaturebank', url: 'https://www.nationalevacaturebank.nl', domain: 'nationalevacaturebank.nl', countries: ['NL'] },

  // Poland
  { id: 'pracuj-pl', name: 'Pracuj.pl', url: 'https://www.pracuj.pl', domain: 'pracuj.pl', countries: ['PL'] },
  { id: 'justjoin-pl', name: 'Just Join IT', url: 'https://justjoin.it', domain: 'justjoin.it', countries: ['PL', 'REMOTE'] },
  { id: 'nofluffjobs-pl', name: 'No Fluff Jobs', url: 'https://nofluffjobs.com', domain: 'nofluffjobs.com', countries: ['PL'] },
  { id: 'bulldogjob-pl', name: 'Bulldogjob', url: 'https://bulldogjob.com', domain: 'bulldogjob.com', countries: ['PL'] },

  // Canada & Australia
  { id: 'indeed-ca', name: 'Indeed Canada', url: 'https://ca.indeed.com', domain: 'ca.indeed.com', countries: ['CA'] },
  { id: 'jobbank-ca', name: 'Job Bank Canada', url: 'https://www.jobbank.gc.ca', domain: 'jobbank.gc.ca', countries: ['CA'] },
  { id: 'seek-au', name: 'Seek Australia', url: 'https://www.seek.com.au', domain: 'seek.com.au', countries: ['AU'] },
  { id: 'indeed-au', name: 'Indeed Australia', url: 'https://au.indeed.com', domain: 'au.indeed.com', countries: ['AU'] },
  { id: 'seek-nz', name: 'Seek New Zealand', url: 'https://www.seek.co.nz', domain: 'seek.co.nz', countries: ['AU'] },

  // India
  { id: 'naukri-in', name: 'Naukri', url: 'https://www.naukri.com', domain: 'naukri.com', countries: ['IN'] },
  { id: 'indeed-in', name: 'Indeed India', url: 'https://in.indeed.com', domain: 'indeed.co.in', countries: ['IN'] },
  { id: 'foundit-in', name: 'Foundit', url: 'https://www.foundit.in', domain: 'foundit.in', countries: ['IN'] },

  // Ireland & Spain & Italy
  { id: 'irishjobs-ie', name: 'IrishJobs', url: 'https://www.irishjobs.ie', domain: 'irishjobs.ie', countries: ['IE'] },
  { id: 'jobs-ie', name: 'Jobs.ie', url: 'https://www.jobs.ie', domain: 'jobs.ie', countries: ['IE'] },
  { id: 'infojobs-es', name: 'InfoJobs', url: 'https://www.infojobs.net', domain: 'infojobs.net', countries: ['ES'] },
  { id: 'tecnoempleo-es', name: 'Tecnoempleo', url: 'https://www.tecnoempleo.com', domain: 'tecnoempleo.com', countries: ['ES'] },
  { id: 'indeed-it', name: 'Indeed Italy', url: 'https://it.indeed.com', domain: 'it.indeed.com', countries: ['IT'] },

  // Nordics
  { id: 'arbetsformedlingen-se', name: 'Arbetsförmedlingen', url: 'https://arbetsformedlingen.se', domain: 'arbetsformedlingen.se', countries: ['SE'] },
  { id: 'jobbland-se', name: 'Jobbland', url: 'https://jobbland.se', domain: 'jobbland.se', countries: ['SE'] },
  { id: 'finn-no', name: 'Finn.no Jobs', url: 'https://www.finn.no/job', domain: 'finn.no', countries: ['WORLDWIDE', 'REMOTE'] },

  // Israel & UAE
  { id: 'alljobs-il', name: 'AllJobs', url: 'https://www.alljobs.co.il', domain: 'alljobs.co.il', countries: ['IL'] },
  { id: 'drushim-il', name: 'Drushim', url: 'https://www.drushim.co.il', domain: 'drushim.co.il', countries: ['IL'] },
  { id: 'bayt-ae', name: 'Bayt.com', url: 'https://www.bayt.com', domain: 'bayt.com', countries: ['AE', 'WORLDWIDE'] },
  { id: 'gulftalent-ae', name: 'GulfTalent', url: 'https://www.gulftalent.com', domain: 'gulftalent.com', countries: ['AE'] },

  // Asia-Pacific
  { id: 'jobstreet-sg', name: 'JobStreet Singapore', url: 'https://www.jobstreet.com.sg', domain: 'jobstreet.com.sg', countries: ['SG'] },
  { id: 'mycareersfuture-sg', name: 'MyCareersFuture', url: 'https://www.mycareersfuture.gov.sg', domain: 'mycareersfuture.gov.sg', countries: ['SG'] },
  { id: 'jobsdb-apac', name: 'JobsDB', url: 'https://www.jobsdb.com', domain: 'jobsdb.com', countries: ['SG'] },
  { id: 'daijob-jp', name: 'Daijob', url: 'https://daijob.com', domain: 'daijob.com', countries: ['JP'] },
  { id: 'indeed-jp', name: 'Indeed Japan', url: 'https://jp.indeed.com', domain: 'jp.indeed.com', countries: ['JP'] },
  { id: 'saramin-kr', name: 'Saramin', url: 'https://www.saramin.co.kr', domain: 'saramin.co.kr', countries: ['KR'] },
  { id: 'jobkorea-kr', name: 'JobKorea', url: 'https://www.jobkorea.co.kr', domain: 'jobkorea.co.kr', countries: ['KR'] },

  // Brazil & LATAM
  { id: 'indeed-br', name: 'Indeed Brazil', url: 'https://br.indeed.com', domain: 'br.indeed.com', countries: ['BR'] },
  { id: 'catho-br', name: 'Catho', url: 'https://www.catho.com.br', domain: 'catho.com.br', countries: ['BR'] },
  { id: 'computrabajo', name: 'Computrabajo', url: 'https://www.computrabajo.com', domain: 'computrabajo.com', countries: ['BR', 'ES'] },
] as const;

const GLOBAL_CODES = new Set(['WORLDWIDE', 'REMOTE', 'GLOBAL']);

/** Sites relevant to a selected country (includes global/remote boards). */
export function jobWebsitesForCountry(countryCode: string): JobWebsite[] {
  const code = countryCode.toUpperCase();
  return JOB_WEBSITES.filter(
    (site) =>
      GLOBAL_CODES.has(code) ||
      site.countries.some((c) => GLOBAL_CODES.has(c) || c === code)
  );
}

/** Comma-separated names for LLM prompts (top N by list order). */
export function formatJobWebsitesForPrompt(countryCode: string, maxNames = 12): string {
  const sites = jobWebsitesForCountry(countryCode);
  const names = sites.slice(0, maxNames).map((s) => s.name);
  const extra = sites.length > maxNames ? `, and ${sites.length - maxNames} more` : '';
  return `${names.join(', ')}${extra}`;
}

export function jobWebsiteCount(): number {
  return JOB_WEBSITES.length;
}
