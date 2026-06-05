import type { AIClient, LlmProviderId, StructuredGenerateRequest } from '../types.js';
import type { JobMatchResult } from '../../types.js';

const DEMO_JOBS: JobMatchResult = {
  jobs: [
    {
      title: 'Senior DevOps Engineer',
      company: 'Example Corp',
      location: 'Remote (EU)',
      score: 92,
      rationale:
        'Demo listing — configure OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY for real matches.',
      tags: ['Kubernetes', 'Terraform', 'AWS'],
      applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=senior%20devops%20engineer',
      logoUrl: 'https://logo.clearbit.com/linkedin.com',
      salaryEstimate: '$6,500 – $9,500 / mo (demo estimate)',
    },
    {
      title: 'Platform Engineer',
      company: 'CloudScale',
      location: 'Hybrid — Berlin',
      score: 88,
      rationale: 'Demo listing — configure an LLM API key for real agentic board search.',
      tags: ['GCP', 'Helm', 'Observability'],
      applyUrl: 'https://www.glassdoor.com/Job/platform-engineer-jobs-SRCH_KO0,18.htm',
      logoUrl: 'https://logo.clearbit.com/glassdoor.com',
      salaryEstimate: '$7,000 – $10,000 / mo (demo estimate)',
    },
  ],
  suggestions: [
    'Staff SRE remote Europe',
    'Kubernetes platform engineer',
    'CI/CD lead DevOps',
  ],
};

export class DemoAIClient implements AIClient {
  readonly provider: LlmProviderId = 'demo';
  readonly model = 'demo';

  async generateStructured<T>(request: StructuredGenerateRequest): Promise<T> {
    if (request.task === 'job_match') {
      return DEMO_JOBS as T;
    }
    return {
      status: 'success',
      output: {
        summary: request.userPrompt.slice(0, 200) || 'Demo CV summary',
        skills: ['JavaScript', 'Kubernetes', 'Docker', 'Terraform'],
        experience: [
          {
            role: 'DevOps Engineer',
            company: 'Previous Employer',
            duration: '2020 – Present',
            description: 'Infrastructure and CI/CD ownership (demo data).',
          },
        ],
        education: [],
      },
    } as T;
  }
}
