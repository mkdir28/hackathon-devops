import { Router } from 'express';
import { runAgenticJobMatch } from '../services/llm.js';

const router = Router();

router.post('/match', async (req, res) => {
  try {
    const {
      prompt,
      query,
      countryCode,
      countryName,
      timeRange,
      salaryHint,
      cvSummary,
      cvSkills,
      response_json_schema,
    } = req.body as {
      prompt?: string;
      query?: string;
      countryCode?: string;
      countryName?: string;
      timeRange?: string;
      salaryHint?: string;
      cvSummary?: string;
      cvSkills?: string[];
      response_json_schema?: Record<string, unknown>;
    };
    if (!prompt || !query) {
      res.status(400).json({ message: 'prompt and query are required' });
      return;
    }
    const result = await runAgenticJobMatch({
      prompt,
      query,
      countryCode: countryCode ?? 'WORLDWIDE',
      countryName: countryName ?? 'Worldwide',
      timeRange,
      salaryHint,
      cvSummary,
      cvSkills,
      response_json_schema: response_json_schema ?? {},
    });
    res.json(result);
  } catch (err) {
    console.error('[jobs/match]', err);
    const message = err instanceof Error ? err.message : 'Job match failed';
    res.status(500).json({ message });
  }
});

export default router;
