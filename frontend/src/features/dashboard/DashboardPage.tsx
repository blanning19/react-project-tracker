import { useEffect, type JSX } from "react";

import { useStore } from "@/library/hooks/UseStore";
import DateUtils from "@/library/utils/DateUtils";
import FormatUtils from "@/library/utils/FormatUtils";

import TaskController from "../tasks/controllers/TaskController";
import TaskViewModel from "../tasks/models/ViewModel";

import IctCompletion from "./views/IctCompletion";
import IctCountByWindow from "./views/IctCountByWindow";
import PendingApprovals from "./views/PendingApprovals";
import SubjectAreaMixed from "./views/SubjectAreaMixed";

/**
 * Renders the ICT readiness dashboard page.
 *
 * This page serves as the main dashboard surface for the feature and presents
 * a high-level readiness snapshot for the current day.
 *
 * Layout overview:
 * - Header showing the dashboard title, description, and last-updated date
 * - Main panel grid containing:
 *   - {@link IctCompletion} for completion status metrics
 *   - {@link PendingApprovals} for outstanding approval counts
 *   - {@link IctCountByWindow} for readiness counts by window
 *   - {@link SubjectAreaMixed} for subject-area breakdown details
 *
 * Data behavior:
 * - Requests the latest task list once when the page mounts
 * - Re-renders when the timeline task list changes in the shared store
 *
 * @returns The rendered dashboard page.
 */
export function DashboardPage(): JSX.Element
{
    const taskViewModel: TaskViewModel = TaskViewModel.GetInstance();

    useStore(taskViewModel.timelineTaskList);

    const today: Date = DateUtils.currentDateAtNoon();

    function getViewWrapperStyles(): string
    {
        const combined: Array<string> = [];

        combined.push("relative");
        combined.push("md:mx-auto w-full max-w-none mt-10 px-6 pt-10");
        combined.push("overflow-y-scroll");
        combined.push("shadow-[0_30px_80px_-60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 ring-inset");
        combined.push("md:rounded-3xl");
        combined.push(" ");

        return combined.join(" ");
    }

    useEffect(() =>
    {
        TaskController.getTaskList();

        return () =>
        {
        };
    }, []);

    return (
        <div className={getViewWrapperStyles() + " "}>
            <div className="pointer-events-none absolute -translate-x-24 -translate-y-24 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(247,198,0,0.1),transparent_90%)] blur-3xl" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.4em] text-mist">Dashboard</p>

                        <h1 className="text-2xl font-semibold text-ink md:text-3xl">
                            ICT readiness snapshot
                        </h1>

                        <p className="text-sm text-mist">
                            Overview of completion, approvals, and readiness by window.
                        </p>
                    </div>

                    <div className="inline-flex cursor-default items-center rounded-full border border-white/10 bg-[#0b0f13]/80 px-3 py-1 text-xs text-mist shadow-sm select-none">
                        Updated {FormatUtils.formatLongDate(today)}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <IctCompletion />
                    <PendingApprovals />
                    <IctCountByWindow />
                    <SubjectAreaMixed />
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
