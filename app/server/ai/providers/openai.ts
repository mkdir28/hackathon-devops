import OpenAI from 'openai';
import { config } from '../../config.js';
import { schemaInstruction, parseJsonFromModelText } from '../json.js';
import { buildSkillsSystemAppendix } from '../skills/loader.js';
import type { AIClient, LlmProviderId, StructuredGenerateRequest } from '../types.js';

export class OpenAIProvider implements AIClient {
  readonly provider: LlmProviderId = 'openai';
  readonly model: string;
  private readonly client: OpenAI;

  constructor(model?: string) {
    this.model = model ?? config.openaiModel;
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async generateStructured<T>(request: StructuredGenerateRequest): Promise<T> {
    const skills = buildSkillsSystemAppendix(request.task);
    const system =
      request.systemPrompt +
      skills +
      '\n\n' +
      schemaInstruction(request.jsonSchema);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: request.userPrompt },
      ],
      response_format: request.jsonSchema
        ? {
            type: 'json_schema',
            json_schema: {
              name: `${request.task}_response`,
              strict: false,
              schema: request.jsonSchema,
            },
          }
        : { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Empty OpenAI response');
    return parseJsonFromModelText<T>(text);
  }
}
