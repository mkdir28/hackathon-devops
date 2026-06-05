# CV extraction

> Parse resume text into structured fields for downstream job matching.

## Behavior

- Extract `summary`, `skills[]`, `experience[]`, and `education[]` when present.
- Do not invent employers or dates; use only what appears in the document.
- Normalize skill names (e.g. "K8s" → include "Kubernetes" if context supports it).
- Keep descriptions concise.
