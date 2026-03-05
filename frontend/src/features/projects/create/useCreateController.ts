import { useProjectFormController } from "../shared/useProjectFormController";

/**
 * Wrapper controller for the Create feature.
 *
 * Create and Edit share the same form behaviors, so the heavy lifting lives in
 * `useProjectFormController`. This wrapper exists to keep feature boundaries
 * explicit and imports stable for the Create route.
 */
export function useCreateController() {
    return useProjectFormController({ mode: "create" });
}
