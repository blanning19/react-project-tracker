/**
 * @file Edit Project page wiring component.
 *
 * @module projects/edit/Edit
 */

import type { Control, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormPageView from "../shared/ProjectFormPageView";
import { useEditController } from "./useEditController";
import type { ProjectFormValues } from "../models/project.types";

/**
 * Wires {@link useEditController} to {@link ProjectFormPageView}.
 *
 * Responsibilities:
 * - Gather edit-page state and handlers from the controller hook.
 * - Pass the prepared controller output to the shared form page view.
 *
 * Intentionally thin — no logic, no state. All behaviour lives in the
 * controller (including route-param extraction via `useParams`); all
 * rendering lives in the view.
 *
 * ### Why the casts on `control` and `handleSubmit`
 * Same generic resolution issue as `Create.tsx` — see that file for the
 * full explanation. The casts are safe; runtime behaviour is unaffected.
 *
 * @returns The rendered Edit Project page.
 */
function Edit(): JSX.Element {
    const {
        control,
        formState: { errors },
        handleSubmit,
        submission,
        reloadData,
        managers,
        employees,
        loading,
        apiError,
        isSubmitting,
    } = useEditController();

    return (
        <ProjectFormPageView
            title="Edit Project"
            submitLabel="Save changes"
            submittingLabel="Saving..."
            control={control as Control<ProjectFormValues>}
            errors={errors}
            handleSubmit={handleSubmit as UseFormHandleSubmit<ProjectFormValues>}
            submission={submission}
            managers={managers}
            employees={employees}
            loading={loading}
            apiError={apiError}
            isSubmitting={isSubmitting}
            onRetry={reloadData}
        />
    );
}

export default Edit;
