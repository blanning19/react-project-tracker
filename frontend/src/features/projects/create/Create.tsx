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
        reloadData,

        // REMARK: Renamed controller output from `projectManagers` to `managers`.
        managers,

        employees,
        loading,
        apiError,
        isSubmitting,
    } = useCreateController();

    return (
        <ProjectFormPageView
            title="Create Project"
            submitLabel="Create Project"
            submittingLabel="Creating..."
            control={control}
            errors={errors}
            handleSubmit={handleSubmit}
            submission={submission}

            // REMARK: Renamed prop from `projectManagers` to `managers`.
            managers={managers}

            employees={employees}
            loading={loading}
            apiError={apiError}
            isSubmitting={isSubmitting}
            onRetry={reloadData}
        />
    );
}

export default Create;