/**
 * @file Controller hook for the Edit Project page.
 *
 * @module projects/edit/useEditController
 */

import { useParams } from "react-router-dom";

import { useProjectFormController } from "../shared/useProjectFormController";

/**
 * Controller hook for the Edit Project feature.
 *
 * Extracts the project ID from the route (`/edit/:id`) and passes it to
 * {@link useProjectFormController} in `"edit"` mode. All form behaviour and
 * API interaction is handled by the shared controller.
 *
 * @returns The full form controller shape from {@link useProjectFormController},
 *   with the project pre-populated from the API.
 *
 * @example
 * ```tsx
 * function Edit() {
 *   const controller = useEditController();
 *   return (
 *     <ProjectFormPageView
 *       title="Edit project"
 *       submitLabel="Update"
 *       submittingLabel="Updating…"
 *       {...controller}
 *     />
 *   );
 * }
 * ```
 */
export function useEditController() {
    const { id: projectId = "" } = useParams();
    return useProjectFormController({ mode: "edit", projectId });
}
