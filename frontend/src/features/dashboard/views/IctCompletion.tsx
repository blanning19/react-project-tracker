import { type JSX } from "react";

/**
 * Displays ICT completion metrics for the dashboard.
 *
 * @returns The ICT completion dashboard panel.
 */
export function IctCompletion(): JSX.Element
{
    return (
        <section className="rounded-2xl border border-white/10 bg-[#11161c] p-5 text-white shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-gray-400">
                ICT Completion
            </div>

            <div className="text-3xl font-semibold">82%</div>

            <p className="mt-2 text-sm text-gray-300">
                Stub panel: replace with real completion metrics.
            </p>
        </section>
    );
}

export default IctCompletion;
