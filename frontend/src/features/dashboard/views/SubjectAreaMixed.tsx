import { type JSX } from "react";

/**
 * Displays subject-area readiness details for the dashboard.
 *
 * @returns The subject-area dashboard panel.
 */
export function SubjectAreaMixed(): JSX.Element
{
    return (
        <section className="rounded-2xl border border-white/10 bg-[#11161c] p-5 text-white shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-gray-400">
                Subject Area Mixed
            </div>

            <ul className="space-y-2 text-sm text-gray-200">
                <li>Network: Ready</li>
                <li>Identity: In Progress</li>
                <li>Endpoints: At Risk</li>
            </ul>
        </section>
    );
}

export default SubjectAreaMixed;
