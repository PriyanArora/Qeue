# Qeue Codex Notes

Read first:

- `codex/ProjectSummary.md` - source of truth for scope, architecture, and roadmap.
- `codex/Progress.md` - current status and next work.
- `codex/codex_progress.md` - detailed overhaul checklist.
- `codex/BuildFlow.md` - verification and roadmap order.
- `codex/RepoStructure.md` - active folders.
- `codex/progress_manual_tasks.md` - manual proof checklist.

Rules:

- Keep browser traffic through `gateway-service`.
- Keep service data ownership separate.
- Prefer existing services and projections over new services or synchronous cross-service reads.
- Do not commit real secrets.
- Do not mark work complete without proof.
- Keep docs concise and current.
