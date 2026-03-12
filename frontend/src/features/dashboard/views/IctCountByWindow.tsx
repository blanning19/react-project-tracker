import { type JSX } from "react";

/**
 * Displays ICT readiness counts grouped by window.
 *
 * @returns The readiness-by-window dashboard panel.
 */
export function IctCountByWindow(): JSX.Element
{
    return (
        <section className="rounded-2xl border border-white/10 bg-[#11161c] p-5 text-white shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-gray-400">
                ICT Count By Window
            </div>

            <ul className="space-y-2 text-sm text-gray-200">
                <li>0-30 days: 6</li>
                <li>31-60 days: 9</li>
                <li>61-90 days: 4</li>
            </ul>
        </section>
    );
}

export default IctCountByWindow;
