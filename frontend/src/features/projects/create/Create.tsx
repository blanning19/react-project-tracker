/**
 * @file Create Project page wiring component.
 *
 * @module projects/create/Create
 */

import type { Control, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormPageView from "../shared/ProjectFormPageView";
import { useCreateController } from "./useCreateController";
import type { ProjectFormValues } from "../models/project.types";

/**
 * Wires {@link useCreateController} to {@link ProjectFormPageView}.
 *
 * Responsibilities:
 * - Gather create-page state and handlers from the controller hook.
 * - Pass the prepared controller output to the shared form page view.
 *
 * Intentionally thin — no logic, no state. All behaviour lives in the
 * controller; all rendering lives in the view.
 *
 * ### Why the casts on `control` and `handleSubmit`
 * `useForm<ProjectFormValues>` spreads through `useProjectFormController`
 * and back up to `useCreateController`. By the time TypeScript sees the
 * destructured values here, the type parameter has been widened to the
 * generic `TFieldValues` variable. `ProjectFormPageView` expects the
 * concrete `Control<ProjectFormValues>` / `UseFormHandleSubmit<ProjectFormValues>`
 * types, so we cast. The runtime values are identical — this is a TypeScript
 * generic resolution issue only.
 *
 * @returns The rendered Create Project page.
 */
function Create(): JSX.Element {
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
    } = useCreateController();

    return (
        <ProjectFormPageView
            title="Create Project"
            submitLabel="Create Project"
            submittingLabel="Creating..."
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

export default Create;
