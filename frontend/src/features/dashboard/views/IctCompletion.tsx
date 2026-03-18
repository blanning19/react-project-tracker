import { type JSX } from "react";

/**
 * Displays ICT completion metrics for the dashboard.
 *
 * Responsibilities:
 * - Show the overall completion percentage.
 * - Summarize completed versus total tasks.
 * - Present the data in a compact dashboard panel.
 *
 * Data behavior:
 * - Currently uses stubbed values.
 * - Can later be connected to real dashboard task data.
 *
 * @returns The ICT completion dashboard panel.
 */
export function IctCompletion(): JSX.Element
{
    const completedPercent: number = 82;
    const completedCount: number = 41;
    const totalCount: number = 50;
    const trendLabel: string = "Up 6% from the previous readiness window.";

    return (
        <section className="dashboard-card h-100">
            <div className="dashboard-card-header">
                <div className="dashboard-card-label">ICT Completion</div>

                <p className="dashboard-card-description mb-0">
                    Completion progress for the current readiness view.
                </p>
            </div>

            <div className="dashboard-metric-panel">
                <div className="dashboard-stat-value">{completedPercent}%</div>

                <p className="dashboard-metric-caption mb-0">
                    {trendLabel}
                </p>
            </div>

            <div className="dashboard-detail-row">
                <span className="dashboard-detail-label">Completed tasks</span>

                <span className="dashboard-detail-value">
                    {completedCount} / {totalCount}
                </span>
            </div>
        </section>
    );
}

export default IctCompletion;