import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import Edit from "../features/projects/edit/Edit";

/**
 * Mock the edit controller hook so this test verifies only the Edit page
 * composition and the page-level values passed into the shared form UI.
 */
const mockUseEditController = vi.fn();

vi.mock("../features/projects/edit/useEditController", () => ({
    useEditController: () => mockUseEditController(),
}));

/**
 * Mock the shared form page/view so the test can focus on title, loading, error,
 * and submit-label behavior without depending on the complete form rendering.
 */
vi.mock("../features/projects/shared/ProjectFormPageView", () => ({
    default: (props: {
        title: string;
        submitLabel: string;
        loading: boolean;
        apiError: string;
    }) => (
        <div>
            <div>{props.title}</div>
            {props.loading && <div>Loading form data...</div>}
            {props.apiError && <div>{props.apiError}</div>}
            <button type="button">{props.submitLabel}</button>
        </div>
    ),
}));

describe("Edit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders the edit page title and submit label", () => {
        mockUseEditController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: false,
            apiError: "",
        });

        render(<Edit />);

        expect(screen.getByText("Edit Project")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    });

    test("renders loading state from the edit controller", () => {
        mockUseEditController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: true,
            apiError: "",
        });

        render(<Edit />);

        expect(screen.getByText("Loading form data...")).toBeInTheDocument();
    });

    test("renders api error from the edit controller", () => {
        mockUseEditController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: false,
            apiError: "Failed to load project data.",
        });

        render(<Edit />);

        expect(screen.getByText("Edit Project")).toBeInTheDocument();
        expect(screen.getByText("Failed to load project data.")).toBeInTheDocument();
    });
});