# AI Specification

The server calls Google's official JavaScript SDK `@google/genai`. `GEMINI_API_KEY` and `GEMINI_MODEL` are environment-only settings; the model is not hard-coded. The generation service requests `application/json` structured output, then validates it locally with Zod and deterministic cross-reference checks.

Validation covers the requested suspect count and difficulty, 6–12 evidence items, at least three evidence types, unique IDs, valid suspect/evidence references, parseable timeline dates, a valid culprit, and at least two distinct supporting evidence references. The prompt treats the scenario as untrusted fictional text. Invalid responses receive no more than two bounded repair attempts; provider and validation errors are recoverable and do not create a case.

Hint generation receives only evidence relevant to solution clues and is constrained not to name the culprit. A deterministic clue-based fallback is used if hint generation is unavailable. Image/video generation is independent and not configured in this MVP; generated text is never represented as a generated photograph or video.
