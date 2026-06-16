import { describe, it, expect } from 'vitest';
import { parseJsonFromModelText, schemaInstruction } from '../../ai/json.js';

describe('parseJsonFromModelText', () => {
  it('parses a plain JSON object', () => {
    const result = parseJsonFromModelText<{ score: number }>('{"score":42}');
    expect(result.score).toBe(42);
  });

  it('parses a plain JSON array', () => {
    const result = parseJsonFromModelText<number[]>('[1,2,3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('strips markdown code fences (```json ... ```)', () => {
    const text = '```json\n{"jobs":[]}\n```';
    const result = parseJsonFromModelText<{ jobs: unknown[] }>(text);
    expect(result.jobs).toEqual([]);
  });

  it('strips plain ``` fences', () => {
    const text = '```\n{"ok":true}\n```';
    const result = parseJsonFromModelText<{ ok: boolean }>(text);
    expect(result.ok).toBe(true);
  });

  it('extracts JSON embedded in prose text', () => {
    const text = 'Here is the result:\n{"answer":"yes"}\nDone.';
    const result = parseJsonFromModelText<{ answer: string }>(text);
    expect(result.answer).toBe('yes');
  });

  it('throws when no valid JSON can be extracted', () => {
    expect(() => parseJsonFromModelText('No JSON here at all')).toThrow(
      'Model response did not contain valid JSON'
    );
  });

  it('handles leading and trailing whitespace', () => {
    const result = parseJsonFromModelText<{ x: number }>('   {"x":7}   ');
    expect(result.x).toBe(7);
  });
});

describe('schemaInstruction', () => {
  it('returns generic instruction when schema is undefined', () => {
    const out = schemaInstruction(undefined);
    expect(out).toContain('valid JSON');
  });

  it('returns generic instruction when schema is empty object', () => {
    const out = schemaInstruction({});
    expect(out).toContain('valid JSON');
  });

  it('embeds the schema as JSON when properties are present', () => {
    const schema = { type: 'object', properties: { score: { type: 'number' } } };
    const out = schemaInstruction(schema);
    expect(out).toContain('"score"');
    expect(out).toContain('JSON Schema');
  });
});