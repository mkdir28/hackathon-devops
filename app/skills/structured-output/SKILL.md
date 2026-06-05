# Structured JSON output

> Emit machine-readable JSON that validates against the requested schema.

## Rules

- Output JSON only. No markdown code fences, no preamble, no trailing commentary.
- Use double-quoted keys and strings.
- Omit fields that are truly unknown rather than using placeholder values.
- Arrays must match the schema item types.
