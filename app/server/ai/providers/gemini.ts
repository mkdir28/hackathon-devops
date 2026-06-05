import { GoogleGenAI } from '@google/genai';
import { config } from '../../config.js';
import { schemaInstruction, parseJsonFromModelText } from '../json.js';
import { buildSkillsSystemAppendix } from '../skills/loader.js';
import type { AIClient, LlmProviderId, StructuredGenerateRequest } from '../types.js';

export class GeminiProvider implements AIClient {
  readonly provider: LlmProviderId = 'gemini';
  readonly model: string;
  private readonly client: GoogleGenAI;

  constructor(model?: string) {
    this.model = model ?? config.geminiModel;
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  async generateStructured<T>(request: StructuredGenerateRequest): Promise<T> {
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
