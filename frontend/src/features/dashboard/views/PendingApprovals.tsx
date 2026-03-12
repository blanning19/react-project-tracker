import { type JSX } from "react";

/**
 * Displays pending approval counts for the dashboard.
 *
 * @returns The pending approvals dashboard panel.
 */
export function PendingApprovals(): JSX.Element
{
    return (
        <section className="rounded-2xl border border-white/10 bg-[#11161c] p-5 text-white shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-gray-400">
                Pending Approvals
            </div>

            <div className="text-3xl font-semibold">14</div>

            <p className="mt-2 text-sm text-gray-300">
                Stub panel: replace with real approval counts.
            </p>
        </section>
    );
}

export default PendingApprovals;
