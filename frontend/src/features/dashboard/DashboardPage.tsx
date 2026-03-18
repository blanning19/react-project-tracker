import { useEffect, type JSX } from "react";

import { useStore } from "@/library/hooks/UseStore";
import DateUtils from "@/library/utils/DateUtils";
import FormatUtils from "@/library/utils/FormatUtils";

import TaskController from "../tasks/controllers/TaskController";
import TaskViewModel from "../tasks/models/ViewModel";

import IctCompletion from "./views/IctCompletion";
import IctCountByWindow from "./views/IctCountByWindow";
import PendingApprovals, { type AstroDocComponentLink } from "./views/PendingApprovals";
import SubjectAreaMixed from "./views/SubjectAreaMixed";

/**
 * Renders the ICT readiness dashboard page.
 *
 * This page serves as the main dashboard surface for the feature and presents
 * a high-level readiness snapshot for the current day.
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

    const documentedComponents: Array<AstroDocComponentLink> = [
        {
            id: "dashboard-page",
            title: "DashboardPage",
            summary: "Main ICT readiness dashboard layout and panel composition.",
            href: "/docs/components/dashboard-page/",
        },
        {
            id: "ict-completion",
            title: "IctCompletion",
            summary: "Displays overall completion progress for the current readiness view.",
            href: "/docs/components/ict-completion/",
        },
        {
            id: "pending-approvals",
            title: "PendingApprovals",
            summary: "Dashboard panel for pending approvals and documentation quick access.",
            href: "/docs/components/pending-approvals/",
        },
        {
            id: "subject-area-mixed",
            title: "SubjectAreaMixed",
            summary: "Shows readiness breakdowns across mixed subject areas.",
            href: "/docs/components/subject-area-mixed/",
        },
    ];

    useEffect(() =>
    {
        TaskController.getTaskList();

        return () =>
        {
        };
    }, []);

    return (
        <div className="dashboard-page container-fluid px-3 px-lg-4 py-4">
            <div className="dashboard-shell mx-auto">
                <section className="dashboard-hero mb-4">
                    <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-lg-between gap-3">
                        <div>
                            <div className="dashboard-eyebrow">Dashboard</div>

                            <h1 className="dashboard-title mb-2">
                                ICT readiness snapshot
                            </h1>

                            <p className="dashboard-subtitle mb-0">
                                Overview of completion, approvals, and readiness by window.
                            </p>
                        </div>

                        <div className="dashboard-updated-pill">
                            Updated {FormatUtils.formatLongDate(today)}
                        </div>
                    </div>
                </section>

                <div className="row g-4">
                    <div className="col-12 col-xl-6">
                        <IctCompletion />
                    </div>

                    <div className="col-12 col-xl-6">
                        <PendingApprovals components={documentedComponents} docsHomeHref="/docs/components/" />
                    </div>

                    <div className="col-12 col-xl-6">
                        <IctCountByWindow />
                    </div>

                    <div className="col-12 col-xl-6">
                        <SubjectAreaMixed />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;