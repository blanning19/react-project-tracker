import { type JSX } from "react";

/**
 * Defines the count values shown across readiness windows.
 */
interface IctWindowCount
{
    id: string;
    label: string;
    count: number;
}

/**
 * Defines the summary values used by the ICT count-by-window panel.
 */
interface IctCountByWindowSummary
{
    totalCount: number;
    highestWindowLabel: string;
}

interface IctCountByWindowListProps
{
    windows: Array<IctWindowCount>;
}

interface IctCountByWindowSummaryProps
{
    summary: IctCountByWindowSummary;
}

/**
 * Displays the header content for the ICT count-by-window panel.
 *
 * @returns The rendered panel header.
 */
function IctCountByWindowHeader(): JSX.Element
{
    return (
        <div className="dashboard-card-header">
            <div className="dashboard-card-label">ICT Count by Window</div>

            <p className="dashboard-card-description mb-0">
                Task counts grouped by readiness window for the current view.
            </p>
        </div>
    );
}

/**
 * Displays the list of readiness window counts.
 *
 * @param props Contains the visible readiness window values.
 * @returns The rendered window count list.
 */
function IctCountByWindowList(props: IctCountByWindowListProps): JSX.Element
{
    const { windows } = props;

    return (
        <div className="dashboard-doc-link-list">
            {windows.map((window: IctWindowCount) =>
            (
                <div
                    key={window.id}
                    className="dashboard-detail-row"
                >
                    <span className="dashboard-detail-label">{window.label}</span>

                    <span className="dashboard-detail-value">{window.count}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * Displays the summary block for the ICT count-by-window panel.
 *
 * @param props Contains the summary values for the current panel state.
 * @returns The rendered summary section.
 */
function IctCountByWindowSummaryBlock(props: IctCountByWindowSummaryProps): JSX.Element
{
    const { summary } = props;

    return (
        <div className="dashboard-metric-panel mt-3">
            <div className="dashboard-detail-row">
                <span className="dashboard-detail-label">Total tasks</span>
                <span className="dashboard-detail-value">{summary.totalCount}</span>
            </div>

            <div className="dashboard-detail-row mt-3">
                <span className="dashboard-detail-label">Highest window</span>
                <span className="dashboard-detail-value">{summary.highestWindowLabel}</span>
            </div>
        </div>
    );
}

/**
 * Displays task counts grouped by readiness window for the dashboard.
 *
 * Responsibilities:
 * - Show task counts grouped by readiness window.
 * - Summarize the total visible task count.
 * - Highlight the window with the highest count.
 *
 * Data behavior:
 * - Currently uses stubbed readiness window values.
 * - Can later be connected to dashboard task or reporting data.
 *
 * @returns The ICT count-by-window dashboard panel.
 */
export function IctCountByWindow(): JSX.Element
{
    function getWindowCounts(): Array<IctWindowCount>
    {
        return [
            { id: "window-1", label: "0 - 7 Days", count: 12 },
            { id: "window-2", label: "8 - 14 Days", count: 18 },
            { id: "window-3", label: "15 - 30 Days", count: 9 },
        ];
    }

    function getSummary(windows: Array<IctWindowCount>): IctCountByWindowSummary
    {
        if (windows.length === 0) {
            return {
                totalCount: 0,
                highestWindowLabel: "None",
            };
        }

        let highestWindow: IctWindowCount = windows[0]!;
        let totalCount: number = 0;

        for (const window of windows) {
            totalCount += window.count;

            if (window.count > highestWindow.count) {
                highestWindow = window;
            }
        }

        return {
            totalCount,
            highestWindowLabel: highestWindow.label,
        };
    }

    const windows: Array<IctWindowCount> = getWindowCounts();
    const summary: IctCountByWindowSummary = getSummary(windows);

    return (
        <section className="dashboard-card h-100">
            <IctCountByWindowHeader />
            <IctCountByWindowList windows={windows} />
            <IctCountByWindowSummaryBlock summary={summary} />
        </section>
    );
}

export default IctCountByWindow;