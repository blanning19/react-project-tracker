/**
 * @file Controller hook for the Create Project page.
 *
 * @module projects/create/useCreateController
 */

import { useProjectFormController } from "../shared/useProjectFormController";

/**
 * Controller hook for the Create Project feature.
 *
 * Create and Edit share all form behaviour via {@link useProjectFormController}.
 * This wrapper exists to:
 * - Keep the Create feature boundary explicit (clean import path for `Create.tsx`).
 * - Ensure the `mode` is always `"create"` without the caller having to pass it.
 *
 * @returns The full form controller shape from {@link useProjectFormController}.
 *
 * @example
 * ```tsx
 * function Create() {
 *   const controller = useCreateController();
 *   return (
 *     <ProjectFormPageView
 *       title="Create project"
 *       submitLabel="Save"
 *       submittingLabel="Saving…"
 *       {...controller}
 *     />
 *   );
 * }
 * ```
 */
export function useCreateController() {
    return useProjectFormController({ mode: "create" });
}
