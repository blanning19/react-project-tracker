import { type JSX } from "react";

/**
 * Represents a documented component entry that can be surfaced in the dashboard docs panel.
 */
export interface AstroDocComponentLink
{
    id: string;
    title: string;
    summary?: string;
    href: string;
}

interface PendingApprovalsProps
{
    components?: Array<AstroDocComponentLink>;
    docsHomeHref?: string;
}

interface PendingApprovalsHeaderProps
{
    componentCount: number;
    docsHomeHref: string;
}

interface PendingApprovalsComponentRowProps
{
    component: AstroDocComponentLink;
}

function PendingApprovalsHeader(props: PendingApprovalsHeaderProps): JSX.Element
{
    const { componentCount, docsHomeHref } = props;

    return (
        <div className="dashboard-card-header d-flex justify-content-between align-items-start gap-3">
            <div>
                <div className="dashboard-card-label">Component Docs</div>

                <div className="dashboard-stat-value">{componentCount}</div>

                <p className="dashboard-card-description mb-0">
                    Quick links to documented UI components in Astro.
                </p>
            </div>

            <a href={docsHomeHref} className="dashboard-action-link">
                View all docs
            </a>
        </div>
    );
}

function PendingApprovalsEmptyState(): JSX.Element
{
    return (
        <div className="dashboard-empty-state">
            No documented components are available yet.
        </div>
    );
}

function PendingApprovalsComponentRow(props: PendingApprovalsComponentRowProps): JSX.Element
{
    const { component } = props;

    return (
        <a href={component.href} className="dashboard-doc-link text-decoration-none">
            <div className="d-flex justify-content-between align-items-start gap-3">
                <div className="flex-grow-1 min-w-0">
                    <div className="dashboard-doc-link-title">
                        {component.title}
                    </div>

                    <p className="dashboard-doc-link-summary mb-0">
                        {component.summary || "Open the Astro documentation entry for this component."}
                    </p>
                </div>

                <span className="dashboard-doc-link-badge">Docs</span>
            </div>
        </a>
    );
}

/**
 * Displays a dashboard panel that surfaces links to Astro component documentation.
 *
 * Responsibilities:
 * - Show a compact documentation summary within the dashboard.
 * - Display the current count of linked documented components.
 * - Provide direct navigation to the docs index and selected component pages.
 *
 * @param props Panel inputs containing component links and an optional docs home link.
 * @returns The rendered component documentation dashboard panel.
 */
export function PendingApprovals(props: PendingApprovalsProps): JSX.Element
{
    const { components = [], docsHomeHref = "/docs/components/" } = props;
    const visibleComponents: Array<AstroDocComponentLink> = components.slice(0, 4);

    return (
        <section className="dashboard-card h-100">
            <PendingApprovalsHeader
                componentCount={components.length}
                docsHomeHref={docsHomeHref}
            />

            {visibleComponents.length === 0 ? (
                <PendingApprovalsEmptyState />
            ) : (
                <div className="dashboard-doc-link-list">
                    {visibleComponents.map((component: AstroDocComponentLink) =>
                    (
                        <PendingApprovalsComponentRow
                            key={component.id}
                            component={component}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default PendingApprovals;