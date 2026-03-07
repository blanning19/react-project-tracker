import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, test } from "vitest";
import ProjectFormFields from "../features/projects/shared/ProjectFormFields";
import { DEFAULT_VALUES, STATUS_OPTIONS } from "../features/projects/shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../features/projects/models/project.types";

const mockEmployees: PersonOption[] = [
    { id: 1, first_name: "Brad", last_name: "Lanning" },
    { id: 2, first_name: "Mattie", last_name: "Smith" },
    { id: 3, first_name: "Rocco", last_name: "Jones" },
];

function TestWrapper({
    employees = mockEmployees,
    defaultValues = DEFAULT_VALUES,
}: {
    employees?: PersonOption[];
    defaultValues?: ProjectFormValues;
}) {
    const form = useForm<ProjectFormValues>({ defaultValues });

    return (
        <ProjectFormFields
            control={form.control}
            errors={{}}
            projectManagers={[]}
            employees={employees}
            statusOptions={STATUS_OPTIONS}
        />
    );
}

function getCheckedCount(): number {
    return screen.getAllByRole("checkbox").filter((cb) => (cb as HTMLInputElement).checked).length;
}

describe("ProjectFormFields", () => {
    test("renders employee checkboxes in alphabetical order with none checked initially", () => {
        render(<TestWrapper />);

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes).toHaveLength(3);

        // Alphabetical order: Brad Lanning, Mattie Smith, Rocco Jones
        expect(screen.getByLabelText("Brad Lanning")).toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeInTheDocument();
        expect(screen.getByLabelText("Rocco Jones")).toBeInTheDocument();

        // None checked on initial render
        expect(getCheckedCount()).toBe(0);
    });

    test("updates the checked count when employee checkboxes are toggled", () => {
        render(<TestWrapper />);

        expect(getCheckedCount()).toBe(0);

        fireEvent.click(screen.getByLabelText("Brad Lanning"));
        expect(getCheckedCount()).toBe(1);
        expect(screen.getByLabelText("Brad Lanning")).toBeChecked();

        fireEvent.click(screen.getByLabelText("Mattie Smith"));
        expect(getCheckedCount()).toBe(2);

        fireEvent.click(screen.getByLabelText("Brad Lanning"));
        expect(getCheckedCount()).toBe(1);
        expect(screen.getByLabelText("Brad Lanning")).not.toBeChecked();
    });

    // Button label changed from "Clear selected" → "Clear all"
    test("clear all removes every selected employee", () => {
        render(
            <TestWrapper
                defaultValues={{
                    ...DEFAULT_VALUES,
                    employees: ["1", "2"],
                }}
            />
        );

        expect(getCheckedCount()).toBe(2);

        fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

        expect(getCheckedCount()).toBe(0);
        expect(screen.getByLabelText("Brad Lanning")).not.toBeChecked();
        expect(screen.getByLabelText("Mattie Smith")).not.toBeChecked();
        expect(screen.getByLabelText("Rocco Jones")).not.toBeChecked();
    });

    // Non-matching employees are unmounted from the DOM when filtered,
    // so we check presence rather than visibility.
    test("filters the employee list using the search input", () => {
        render(<TestWrapper />);

        fireEvent.change(screen.getByPlaceholderText("Search employees\u2026"), {
            target: { value: "matt" },
        });

        expect(screen.queryByLabelText("Brad Lanning")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeInTheDocument();
        expect(screen.queryByLabelText("Rocco Jones")).not.toBeInTheDocument();
    });

    test("shows a filtered empty-state message when no employees match the search", () => {
        render(<TestWrapper />);

        fireEvent.change(screen.getByPlaceholderText("Search employees\u2026"), {
            target: { value: "zzz" },
        });

        expect(screen.getByText(/No results for/)).toBeInTheDocument();
    });

    test("shows the empty-state message when no employees are available", () => {
        render(<TestWrapper employees={[]} />);

        expect(screen.getByText("No employees available.")).toBeInTheDocument();
        // "Clear all" is a button; disabled when count is 0
        expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
    });

    test("keeps selected employees checked after filtering and clearing the search", () => {
        render(<TestWrapper />);

        fireEvent.click(screen.getByLabelText("Mattie Smith"));
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(getCheckedCount()).toBe(1);

        // Filter to only Mattie — Brad and Rocco are unmounted
        fireEvent.change(screen.getByPlaceholderText("Search employees\u2026"), {
            target: { value: "matt" },
        });

        expect(screen.queryByLabelText("Brad Lanning")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(screen.queryByLabelText("Rocco Jones")).not.toBeInTheDocument();

        // Clear search — all three visible again
        fireEvent.change(screen.getByPlaceholderText("Search employees\u2026"), {
            target: { value: "" },
        });

        expect(screen.getByLabelText("Brad Lanning")).not.toBeChecked();
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(screen.getByLabelText("Rocco Jones")).not.toBeChecked();
    });

    test("renders Security level select with default value Internal", () => {
        render(<TestWrapper />);

        const selects = screen.getAllByRole("combobox");
        const securitySelect = selects.find(
            (s) => (s as HTMLSelectElement).name === "security_level"
        ) as HTMLSelectElement | undefined;

        expect(securitySelect).toBeDefined();
        expect(securitySelect!.value).toBe("Internal");
    });
});
