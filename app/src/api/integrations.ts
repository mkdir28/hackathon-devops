import type { CvExtractionResponse, JobMatchResponse } from '@/types';
import { request } from './httpClient';

const Core = {
  async UploadFile({ file }: { file: File }): Promise<{ file_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async ExtractDataFromUploadedFile({
    file_url,
    json_schema,
  }: {
    file_url: string;
    json_schema: Record<string, unknown>;
  }): Promise<CvExtractionResponse> {
    return request<CvExtractionResponse>('/cv/extract', {
      method: 'POST',
      body: { file_url, json_schema },
    });
  },

  async InvokeLLM({
    prompt,
    query,
    countryCode,
    countryName,
    timeRange,
    salaryHint,
    cvSummary,
    cvSkills,
    response_json_schema,
  }: {
    prompt: string;
    query: string;
    countryCode: string;
    countryName: string;
    timeRange?: string;
    salaryHint?: string;
    cvSummary?: string;
    cvSkills?: string[];
    response_json_schema: Record<string, unknown>;
  }): Promise<JobMatchResponse> {
    return request<JobMatchResponse>('/jobs/match', {
      method: 'POST',
      body: {
        prompt,
        query,
        countryCode,
        countryName,
        timeRange,
        salaryHint,
        cvSummary,
        cvSkills,
        response_json_schema,
      },
    });
  },
};

export const integrations = { Core };
