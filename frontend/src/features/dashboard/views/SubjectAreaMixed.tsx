import { type JSX } from "react";

/**
 * Defines the readiness values shown for each subject area.
 */
interface SubjectAreaStatus
{
    id: string;
    label: string;
    status: string;
    tone: "success" | "warning" | "danger";
}

/**
 * Defines the summary values used by the subject-area panel.
 */
interface SubjectAreaSummary
{
    readyCount: number;
    inProgressCount: number;
    atRiskCount: number;
}

interface SubjectAreaMixedListProps
{
    subjectAreas: Array<SubjectAreaStatus>;
}

interface SubjectAreaMixedSummaryProps
{
    summary: SubjectAreaSummary;
}

/**
 * Displays the header content for the subject-area readiness panel.
 *
 * @returns The rendered panel header.
 */
function SubjectAreaMixedHeader(): JSX.Element
{
    return (
        <div className="dashboard-card-header">
            <div className="dashboard-card-label">Subject Area Mixed</div>

            <p className="dashboard-card-description mb-0">
                Readiness status by subject area for the current dashboard view.
            </p>
        </div>
    );
}

/**
 * Displays a status badge for a single subject area.
 *
 * @param props Contains the status label and visual tone.
 * @returns The rendered subject-area status badge.
 */
function SubjectAreaMixedBadge(props: { status: string; tone: "success" | "warning" | "danger" }): JSX.Element
{
    const { status, tone } = props;

    function getBadgeClassName(): string
    {
        const classes: Array<string> = ["dashboard-status-badge"];

        if (tone === "success") {
            classes.push("dashboard-status-badge-success");
        } else if (tone === "warning") {
            classes.push("dashboard-status-badge-warning");
        } else {
            classes.push("dashboard-status-badge-danger");
        }

        return classes.join(" ");
    }

    return (
        <span className={getBadgeClassName()}>
            {status}
        </span>
    );
}

/**
 * Displays the list of subject-area readiness values.
 *
 * @param props Contains the visible subject-area readiness entries.
 * @returns The rendered readiness list.
 */
function SubjectAreaMixedList(props: SubjectAreaMixedListProps): JSX.Element
{
    const { subjectAreas } = props;

    return (
        <div className="dashboard-doc-link-list">
            {subjectAreas.map((subjectArea: SubjectAreaStatus) =>
            (
                <div key={subjectArea.id} className="dashboard-detail-row">
                    <span className="dashboard-detail-label">{subjectArea.label}</span>

                    <SubjectAreaMixedBadge
                        status={subjectArea.status}
                        tone={subjectArea.tone}
                    />
                </div>
            ))}
        </div>
    );
}

/**
 * Displays the summary block for the subject-area readiness panel.
 *
 * @param props Contains the summary counts for the current panel state.
 * @returns The rendered summary section.
 */
function SubjectAreaMixedSummaryBlock(props: SubjectAreaMixedSummaryProps): JSX.Element
{
    const { summary } = props;

    return (
        <div className="dashboard-metric-panel mt-3">
            <div className="dashboard-detail-row">
                <span className="dashboard-detail-label">Ready</span>
                <span className="dashboard-detail-value">{summary.readyCount}</span>
            </div>

            <div className="dashboard-detail-row mt-3">
                <span className="dashboard-detail-label">In progress</span>
                <span className="dashboard-detail-value">{summary.inProgressCount}</span>
            </div>

            <div className="dashboard-detail-row mt-3">
                <span className="dashboard-detail-label">At risk</span>
                <span className="dashboard-detail-value">{summary.atRiskCount}</span>
            </div>
        </div>
    );
}

/**
 * Displays subject-area readiness details for the dashboard.
 *
 * Responsibilities:
 * - Show readiness status for each visible subject area.
 * - Summarize how many subject areas are ready, in progress, or at risk.
 * - Present the data in a compact dashboard panel.
 *
 * Data behavior:
 * - Currently uses stubbed readiness values.
 * - Can later be connected to real dashboard readiness data.
 *
 * @returns The subject-area dashboard panel.
 */
export function SubjectAreaMixed(): JSX.Element
{
    function getSubjectAreas(): Array<SubjectAreaStatus>
    {
        return [
            { id: "network", label: "Network", status: "Ready", tone: "success" },
            { id: "identity", label: "Identity", status: "In Progress", tone: "warning" },
            { id: "endpoints", label: "Endpoints", status: "At Risk", tone: "danger" },
        ];
    }

    function getSummary(subjectAreas: Array<SubjectAreaStatus>): SubjectAreaSummary
    {
        let readyCount: number = 0;
        let inProgressCount: number = 0;
        let atRiskCount: number = 0;

        for (const subjectArea of subjectAreas) {
            if (subjectArea.tone === "success") {
                readyCount += 1;
            } else if (subjectArea.tone === "warning") {
                inProgressCount += 1;
            } else {
                atRiskCount += 1;
            }
        }

        return {
            readyCount,
            inProgressCount,
            atRiskCount,
        };
    }

    const subjectAreas: Array<SubjectAreaStatus> = getSubjectAreas();
    const summary: SubjectAreaSummary = getSummary(subjectAreas);

    return (
        <section className="dashboard-card h-100">
            <SubjectAreaMixedHeader />
            <SubjectAreaMixedList subjectAreas={subjectAreas} />
            <SubjectAreaMixedSummaryBlock summary={summary} />
        </section>
    );
}

export default SubjectAreaMixed;