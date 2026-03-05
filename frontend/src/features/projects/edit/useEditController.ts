import { useParams } from "react-router-dom";
import { useProjectFormController } from "../shared/useProjectFormController";

/**
 * Wrapper controller for the Edit feature.
 *
 * The shared controller owns form behavior and API interaction. This wrapper is
 * responsible only for extracting the route id and passing it through.
 */
export function useEditController() {
    const { id: projectId = "" } = useParams();
    return useProjectFormController({ mode: "edit", projectId });
}
