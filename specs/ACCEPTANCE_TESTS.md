# Acceptance Checklist

- [ ] Create a valid mystery from scenario text with the selected settings.
- [ ] Validate 3–6 suspects, 6–12 evidence items, and at least three evidence types.
- [ ] Confirm two independent clues support the hidden culprit.
- [ ] Confirm active responses never contain the solution or culprit ID.
- [ ] Confirm malformed AI output fails safely and generation repair is bounded.
- [ ] Confirm session ownership prevents cross-session case access.
- [ ] Confirm evidence filtering, selection, reviewed state, and notes.
- [ ] Confirm hints are progressive, limited to three, and do not reveal the culprit.
- [ ] Confirm invalid and duplicate accusations are rejected; valid accusation reveals the solution.
- [ ] Confirm completed verdict survives page refresh and appears in session history.
- [ ] Confirm failed generation offers recovery and does not save a partial case.
- [ ] Confirm primary UI is usable by keyboard and on mobile without horizontal scrolling.
- [ ] Confirm build and automated tests pass with local dependencies installed.
- [ ] Smoke test MongoDB/Gemini integration and production HTTPS cookie behavior after deployment.
