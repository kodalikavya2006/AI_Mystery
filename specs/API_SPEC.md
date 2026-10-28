# API Specification

Base path: `/api/v1`. All responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message" } }`.

| Method and path | Behavior |
| --- | --- |
| `GET /health` | API status and non-sensitive MongoDB connection state. |
| `POST /mysteries` | Validate the scenario/settings, generate and validate a complete Gemini case, save it, and return the public-safe case. |
| `GET /mysteries?page=&limit=&status=&difficulty=` | Paginated history for the current signed session only. |
| `GET /mysteries/:id` | Authorized public case, progress, and solution only after an attempt is recorded. |
| `PATCH /mysteries/:id/progress` | Add reviewed evidence IDs and update bounded notes. Evidence IDs must belong to the case. |
| `POST /mysteries/:id/hints` | Request the next progressive hint, up to three. |
| `POST /mysteries/:id/accusation` | Validate a suspect and record the only final attempt; returns verdict and solution. |
| `DELETE /mysteries/:id` | Soft-abandon an active case after ownership validation. |

Mutations use JSON, signed HttpOnly cookies, configured-origin checks, rate limits where cost-sensitive, and request validation. Invalid ObjectIds and unauthorized cases return safe errors. Stack traces, provider credentials, and active-case solutions are never returned.
