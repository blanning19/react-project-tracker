import ProjectFormPageView from "../shared/ProjectFormPageView";
import { useEditController } from "./useEditController";

/**
 * Container component for the Edit feature.
 *
 * Responsibilities:
 * - gather edit-page state and handlers from the controller hook
 * - pass the prepared controller output to the shared form page view
 */
function Edit(): JSX.Element {
    const {
        control,
        formState: { errors },
        handleSubmit,
        submission,
        projectManagers,
        employees,
        loading,
        apiError,
    } = useEditController();

    return (
        <ProjectFormPageView
            title="Edit records"
            submitLabel="Save Changes"
            control={control}
            errors={errors}
            handleSubmit={handleSubmit}
            submission={submission}
            projectManagers={projectManagers}
            employees={employees}
            loading={loading}
            apiError={apiError}
        />
    );
}

export default Edit;