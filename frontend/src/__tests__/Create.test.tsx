import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import Create from "../features/projects/create/Create";

/**
 * Mock the create controller hook so this test focuses only on verifying that
 * the Create page renders the correct page shell and passes controller data
 * into the shared form UI.
 */
const mockUseCreateController = vi.fn();

vi.mock("../features/projects/create/useCreateController", () => ({
    useCreateController: () => mockUseCreateController(),
}));

/**
 * Mock the shared form page/view so the test stays focused on the Create page
 * wiring instead of the full form implementation details.
 *
 * This mock renders the title, loading state, error state, and submit button
 * text so the page-level behavior can be asserted clearly.
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

describe("Create", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders the create page title and submit label", () => {
        mockUseCreateController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: false,
            apiError: "",
        });

        render(<Create />);

        expect(screen.getByText("Create records")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    test("renders loading state from the create controller", () => {
        mockUseCreateController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: true,
            apiError: "",
        });

        render(<Create />);

        expect(screen.getByText("Loading form data...")).toBeInTheDocument();
    });

    test("renders api error from the create controller", () => {
        mockUseCreateController.mockReturnValue({
            control: {},
            formState: { errors: {} },
            handleSubmit: vi.fn(),
            submission: vi.fn(),
            projectManagers: [],
            employees: [],
            loading: false,
            apiError: "Failed to load dropdown data.",
        });

        render(<Create />);

        expect(screen.getByText("Create records")).toBeInTheDocument();
        expect(screen.getByText("Failed to load dropdown data.")).toBeInTheDocument();
    });
});