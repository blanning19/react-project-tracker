# Update Notes

This patch applies the first round of cleanup requested during the deep-dive review.

## Included changes

- Fixed missing `SecurityLevel` type in `frontend/src/features/projects/models/project.types.ts`.
- Added `security_level` to `ProjectFormValues` so shared form config, controllers, and UI use the same typed contract.
- Updated `projectToFormValues()` so edit mode correctly hydrates `security_level` from API data.
- Updated auth/fetch tests to import from feature/shared paths instead of legacy compatibility re-exports.
- Rewrote `RequireAuth.test.jsx` to mock `tokenStore`, which matches the current implementation.
- Removed duplicate `HomeView.test.tsx` because it was identical to `Home.test.tsx`.
- Replaced the incorrect duplicate `useCreateController.test.tsx` with a real create-controller test suite.
- Expanded controller/config test coverage to include `security_level` mapping behavior.
- Converted `backend/requirements.txt` from UTF-16 to UTF-8 for better tooling compatibility.

## Still recommended next

- Remove the legacy `frontend/src/components/*` and `frontend/src/api/*` compatibility layers after import cleanup is complete everywhere.
- Consolidate duplicated create/edit controller logic into a shared `useProjectFormController` hook.
- Move cross-cutting auth utilities under `src/shared/auth` to make the feature-based architecture even clearer.
