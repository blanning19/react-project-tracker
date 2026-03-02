import ProjectFormPageView from "../shared/ProjectFormPageView";
import { useCreateController } from "./useCreateController";

/**
 * Container component for the Create feature.
 *
 * Responsibilities:
 * - gather create-page state and handlers from the controller hook
 * - pass the prepared controller output to the shared form page view
 */
function Create(): JSX.Element {
    const {
        control,
        formState: { errors },
        handleSubmit,
        submission,
        projectManagers,
        employees,
        loading,
        apiError,
    } = useCreateController();

    return (
        <ProjectFormPageView
            title="Create records"
            submitLabel="Submit"
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

export default Create;