import type { JobBoardDefinition, RawJobListing } from '../../agent/types.js';

export const BOARD_DOU: JobBoardDefinition = {
  id: 'dou',
  name: 'DOU.ua',
  domain: 'jobs.dou.ua',
  region: 'Ukraine',
  countries: ['UA', 'GLOBAL'],
  parser: 'dou',
  priority: 10,
  searchUrlTemplate: 'https://jobs.dou.ua/vacancies/?search={query}',
};

export const BOARD_WEB_ONLY: JobBoardDefinition = {
  id: 'web-only-board',
  name: 'Web Only Board',
  domain: 'example.com',
  region: 'Global',
  countries: ['GLOBAL'],
  parser: 'web-only',
  priority: 5,
};

export const BOARD_DJINNI: JobBoardDefinition = {
  id: 'djinni',
  name: 'Djinni',
  domain: 'djinni.co',
  region: 'Remote / Ukraine',
  countries: ['UA', 'GLOBAL'],
  parser: 'djinni',
  priority: 9,
  searchUrlTemplate: 'https://djinni.co/jobs/?keyword={query}',
};

export const BOARD_WORKUA: JobBoardDefinition = {
  id: 'workua',
  name: 'Work.ua',
  domain: 'work.ua',
  region: 'Ukraine',
  countries: ['UA'],
  parser: 'workua',
  priority: 8,
  searchUrlTemplate: 'https://www.work.ua/jobs/{query}/',
};

export const RAW_LISTINGS: RawJobListing[] = [
  {
    title: 'Senior DevOps Engineer',
    company: 'Acme Corp',
    location: 'Ukraine',
    applyUrl: 'https://jobs.dou.ua/vacancies/123/',
    source: 'DOU.ua',
    sourceBoardId: 'dou',
  },
  {
    title: 'Platform Engineer',
    company: 'Beta Ltd',
    location: 'Remote',
    applyUrl: 'https://djinni.co/jobs/456/',
    source: 'Djinni',
    sourceBoardId: 'djinni',
    snippet: 'Kubernetes, Terraform, GitOps',
  },

  //same applyUrl as 1 entry
  {
    title: 'Senior DevOps Engineer (duplicate)',
    company: 'Acme Corp',
    location: 'Ukraine',
    applyUrl: 'https://jobs.dou.ua/vacancies/123/',
    source: 'DOU.ua',
    sourceBoardId: 'dou',
  },
];