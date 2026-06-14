import { Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { searchRawJobs } from '../agent/JobSearchAgent.js';
import { getAIClient } from '../ai/AIClient.js';

const router = Router();

// A map to keep track of active SSE transport sessions and their corresponding McpServer instance
const transportMap = new Map<string, { transport: SSEServerTransport; server: McpServer }>();

// Helper to create and configure a new McpServer instance per session
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'jobmatch-mcp-server',
    version: '1.0.0',
  });

  // Register search_jobs tool
  server.tool(
    'search_jobs',
    {
      query: z.string().describe('The job search query'),
      countryCode: z.string().optional().describe('The ISO 2-letter country code or WORLDWIDE'),
    },
    async ({ query, countryCode }) => {
      try {
        console.info(`[mcp] Tool search_jobs called with query="${query}" country="${countryCode}"`);
        const jobs = await searchRawJobs(query, countryCode || 'WORLDWIDE');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(jobs, null, 2),
            },
          ],
        };
      } catch (err) {
        console.error('[mcp] Error in search_jobs tool:', err);
        return {
          content: [
            {
              type: 'text',
              text: `Error searching jobs: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tailor_cv tool
  server.tool(
    'tailor_cv',
    {
      cvSummary: z.string().describe('Summary of the candidate CV'),
      vacancyDetails: z.string().describe('Details / description of the vacancy'),
    },
    async ({ cvSummary, vacancyDetails }) => {
      try {
        console.info('[mcp] Tool tailor_cv called');
        const client = getAIClient();
        const prompt = `Analyze this candidate's CV and the vacancy details. Suggest CV optimizations (bullet points, skills, etc.) to tailor the CV for this specific role.\n\nCV:\n${cvSummary}\n\nVacancy:\n${vacancyDetails}`;
        const response = await client.generateStructured<{ tailoredSuggestions: string }>({
          task: 'job_match',
          systemPrompt: 'You are an SRE career advisor. Provide a list of CV tailoring suggestions.',
          userPrompt: prompt,
          jsonSchema: {
            type: 'object',
            properties: {
              tailoredSuggestions: { type: 'string' }
            },
            required: ['tailoredSuggestions']
          }
        });
        return {
          content: [
            {
              type: 'text',
              text: response.tailoredSuggestions,
            },
          ],
        };
      } catch (err) {
        console.error('[mcp] Error in tailor_cv tool:', err);
        return {
          content: [
            {
              type: 'text',
              text: `Error tailoring CV: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register draft_cover_letter tool
  server.tool(
    'draft_cover_letter',
    {
      cvSummary: z.string().describe('Summary of the candidate CV'),
      vacancyDetails: z.string().describe('Details / description of the vacancy'),
    },
    async ({ cvSummary, vacancyDetails }) => {
      try {
        console.info('[mcp] Tool draft_cover_letter called');
        const client = getAIClient();
        const prompt = `Draft a professional, customized cover letter for this candidate's CV and the vacancy details.\n\nCV:\n${cvSummary}\n\nVacancy:\n${vacancyDetails}`;
        const response = await client.generateStructured<{ coverLetter: string }>({
          task: 'job_match',
          systemPrompt: 'You are an SRE career advisor. Draft a compelling cover letter.',
          userPrompt: prompt,
          jsonSchema: {
            type: 'object',
            properties: {
              coverLetter: { type: 'string' }
            },
            required: ['coverLetter']
          }
        });
        return {
          content: [
            {
              type: 'text',
              text: response.coverLetter,
            },
          ],
        };
      } catch (err) {
        console.error('[mcp] Error in draft_cover_letter tool:', err);
        return {
          content: [
            {
              type: 'text',
              text: `Error drafting cover letter: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// GET /mcp -> establishes the SSE connection
router.get('/', async (req, res) => {
  console.info(`[mcp] New SSE connection requested`);

  // Create transport. The relative path '/mcp/message' corresponds to POST /mcp/message.
  // SSEServerTransport automatically appends ?sessionId=<uuid> to this path.
  const transport = new SSEServerTransport('/mcp/message', res);
  const sessionId = transport.sessionId;
  
  const server = createMcpServer();
  transportMap.set(sessionId, { transport, server });
  console.info(`[mcp] SSE connection established for sessionId=${sessionId}`);

  req.on('close', () => {
    console.info(`[mcp] SSE connection closed for sessionId=${sessionId}`);
    transportMap.delete(sessionId);
  });

  try {
    await server.connect(transport);
    console.info(`[mcp] MCP server successfully connected for sessionId=${sessionId}`);
  } catch (err) {
    console.error(`[mcp] Failed to connect MCP server for sessionId=${sessionId}:`, err);
  }
});

// POST /mcp/message -> handles messages sent from the client
router.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const session = transportMap.get(sessionId);

  if (!session) {
    console.warn(`[mcp] Received post message for unknown sessionId=${sessionId}`);
    res.status(400).send('Session not found or connection not established');
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (err) {
    console.error(`[mcp] Error handling POST message for sessionId=${sessionId}:`, err);
    res.status(500).send('Internal server error');
  }
});

export default router;
