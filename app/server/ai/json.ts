/** Extract the first JSON object or array from model text output. */
export function parseJsonFromModelText<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const block = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (block?.[1]) {
      return JSON.parse(block[1].trim()) as T;
    }
    const start = trimmed.search(/[{[]/);
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error('Model response did not contain valid JSON');
  }
}

export function schemaInstruction(schema?: Record<string, unknown>): string {
  if (!schema || Object.keys(schema).length === 0) {
    return 'Respond with valid JSON only. No markdown fences or commentary.';
  }
  return `Respond with valid JSON only (no markdown), matching this JSON Schema:\n${JSON.stringify(schema, null, 2)}`;
}
