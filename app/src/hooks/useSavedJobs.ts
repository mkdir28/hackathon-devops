import { useState, useCallback } from 'react';
import type { Job } from '@/types';

const STORAGE_KEY = 'jm-saved-jobs';

function load(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Job[];
  } catch {
    return [];
  }
}

export function useSavedJobs() {
  const [saved, setSaved] = useState<Job[]>(load);

  const toggle = useCallback((job: Job) => {
    setSaved((prev) => {
      const exists = prev.some((j) => j.applyUrl === job.applyUrl);
      const next = exists
        ? prev.filter((j) => j.applyUrl !== job.applyUrl)
        : [job, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (job: Job) => saved.some((j) => j.applyUrl === job.applyUrl),
    [saved]
  );

  return { saved, toggle, isSaved };
}
