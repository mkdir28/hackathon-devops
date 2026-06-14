import { GoogleGenAI } from '@google/genai';
import { config } from '../../config.js';
import { schemaInstruction, parseJsonFromModelText } from '../json.js';
import { buildSkillsSystemAppendix } from '../skills/loader.js';
import type { AIClient, LlmProviderId, StructuredGenerateRequest } from '../types.js';
import { OpenAIProvider } from './openai.js';

export class GeminiProvider implements AIClient {
  readonly provider: LlmProviderId = 'gemini';
  readonly model: string;
  private readonly client: GoogleGenAI | OpenAIProvider;

  constructor(model?: string) {
    this.model = model ?? config.geminiModel;
    if (process.env.GATEWAY_URL) {
      const gatewayBaseURL = process.env.GATEWAY_URL.endsWith('/v1')
        ? process.env.GATEWAY_URL
        : `${process.env.GATEWAY_URL}/v1`;
      this.client = new OpenAIProvider(this.model, gatewayBaseURL);
    } else {
      this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  async generateStructured<T>(request: StructuredGenerateRequest): Promise<T> {
    if (this.client instanceof OpenAIProvider) {
      return this.client.generateStructured<T>(request);
    }

    const skills = buildSkillsSystemAppendix(request.task);
    const system =
      request.systemPrompt +
      skills +
      '\n\n' +
      schemaInstruction(request.jsonSchema);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `${system}\n\n---\n\nUser request:\n${request.userPrompt}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty Gemini response');
    return parseJsonFromModelText<T>(text);
  }
}
