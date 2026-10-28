# Data Model

Mongoose collections are `mysteries`, `attempts`, and `investigationprogress`.

- Mystery: signed-session owner, scenario/settings, active/solved/failed/abandoned status, incident, suspects, public evidence, timeline, private solution, hint count, and timestamps. History is indexed by session and creation time; generation request identifiers are sparse unique.
- Suspect: unique case-local ID, name, age, occupation, biography, relationship, motive, alibi, relevant facts, optional portrait URL.
- Evidence: unique case-local ID, supported evidence type, title, description, type-specific content, optional asset URL, associated suspects, discovery time, reliability, and creation time.
- Attempt: unique mystery reference, owner session, selected suspect, correctness, hint count, and submission time. The unique case reference enforces one final attempt.
- Investigation progress: mystery and session, reviewed evidence IDs, notes up to 5,000 characters, and update time. A compound unique index scopes progress to one owner and case.

The solution is persisted server-side but excluded by the active-case serializer. Only after the final attempt may result data be serialized.
