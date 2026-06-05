import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config.js';
import { schemaInstruction, parseJsonFromModelText } from '../json.js';
import { buildSkillsSystemAppendix } from '../skills/loader.js';
import type { AIClient, LlmProviderId, StructuredGenerateRequest } from '../types.js';

export class ClaudeProvider implements AIClient {
  readonly provider: LlmProviderId = 'claude';
  readonly model: string;
  private readonly client: Anthropic;

  constructor(model?: string) {
    this.model = model ?? config.claudeModel;
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  async generateStructured<T>(request: StructuredGenerateRequest): Promise<T> {
    const skills = buildSkillsSystemAppendix(request.task);
    const system =
      request.systemPrompt +
      skills +
      '\n\n' +
      schemaInstruction(request.jsonSchema);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system,
      messages: [{ role: 'user', content: request.userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    if (!text) throw new Error('Empty Claude response');
    return parseJsonFromModelText<T>(text);
  }
}
