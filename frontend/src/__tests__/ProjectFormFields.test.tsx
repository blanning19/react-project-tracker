import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, test } from "vitest";
import ProjectFormFields from "../features/projects/shared/ProjectFormFields";
import { DEFAULT_VALUES, STATUS_OPTIONS } from "../features/projects/shared/projectFormConfig";
import type { EmployeeOption, ProjectFormValues } from "../features/projects/models/project.types";

// Typed as EmployeeOption[] (not the PersonOption union) so the type satisfies
// the employees prop on ProjectFormFields which expects EmployeeOption[].
const mockEmployees: EmployeeOption[] = [
    { id: 1, first_name: "Brad",   last_name: "Lanning", email: "brad@example.com" },
    { id: 2, first_name: "Mattie", last_name: "Smith",   email: "mattie@example.com" },
    { id: 3, first_name: "Rocco",  last_name: "Jones",   email: "rocco@example.com" },
];

function TestWrapper({
    employees = mockEmployees,
    defaultValues = DEFAULT_VALUES,
}: {
    employees?: EmployeeOption[];
    defaultValues?: ProjectFormValues;
}) {
    const form = useForm<ProjectFormValues>({ defaultValues });

    return (
        <ProjectFormFields
            control={form.control}
            errors={{}}
            managers={[]}
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

        expect(screen.getByLabelText("Brad Lanning")).toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeInTheDocument();
        expect(screen.getByLabelText("Rocco Jones")).toBeInTheDocument();

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
        expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
    });

    test("keeps selected employees checked after filtering and clearing the search", () => {
        render(<TestWrapper />);

        fireEvent.click(screen.getByLabelText("Mattie Smith"));
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(getCheckedCount()).toBe(1);

        fireEvent.change(screen.getByPlaceholderText("Search employees\u2026"), {
            target: { value: "matt" },
        });

        expect(screen.queryByLabelText("Brad Lanning")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(screen.queryByLabelText("Rocco Jones")).not.toBeInTheDocument();

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
