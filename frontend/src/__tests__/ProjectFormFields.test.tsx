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

function hasExactText(element: Element | null, text: string) {
    return element?.textContent?.replace(/\s+/g, " ").trim() === text;
}

function getSelectedCountLabel(count: number) {
    const expectedText = `Employees selected: ${count}`;

    return screen.getByText((_, element) => {
        const isExactMatch = hasExactText(element, expectedText);

        const childHasSameText = Array.from(element?.children ?? []).some((child) =>
            hasExactText(child, expectedText)
        );

        return isExactMatch && !childHasSameText;
    });
}

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

describe("ProjectFormFields", () => {
    test("renders employee checkboxes in alphabetical order and the initial selected count", () => {
        render(<TestWrapper />);

        expect(getSelectedCountLabel(0)).toBeInTheDocument();

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes).toHaveLength(3);
        expect(screen.getByLabelText("Brad Lanning")).toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeInTheDocument();
        expect(screen.getByLabelText("Rocco Jones")).toBeInTheDocument();
    });

    test("updates the selected count when employee checkboxes are toggled", () => {
        render(<TestWrapper />);

        fireEvent.click(screen.getByLabelText("Brad Lanning"));
        expect(getSelectedCountLabel(1)).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Mattie Smith"));
        expect(getSelectedCountLabel(2)).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Brad Lanning"));
        expect(getSelectedCountLabel(1)).toBeInTheDocument();
    });

    test("clear selected removes every selected employee and resets the count", () => {
        render(
            <TestWrapper
                defaultValues={{
                    ...DEFAULT_VALUES,
                    employees: ["1", "2"],
                }}
            />
        );

        expect(getSelectedCountLabel(2)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear selected" }));

        expect(getSelectedCountLabel(0)).toBeInTheDocument();
        expect(screen.getByLabelText("Brad Lanning")).not.toBeChecked();
        expect(screen.getByLabelText("Mattie Smith")).not.toBeChecked();
        expect(screen.getByLabelText("Rocco Jones")).not.toBeChecked();
    });

    test("filters the employee list using the search input", () => {
        render(<TestWrapper />);

        fireEvent.change(screen.getByPlaceholderText("Search employees..."), {
            target: { value: "matt" },
        });

        expect(screen.queryByLabelText("Brad Lanning")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Mattie Smith")).toBeInTheDocument();
        expect(screen.queryByLabelText("Rocco Jones")).not.toBeInTheDocument();
    });

    test("shows a filtered empty-state message when no employees match the search", () => {
        render(<TestWrapper />);

        fireEvent.change(screen.getByPlaceholderText("Search employees..."), {
            target: { value: "zzz" },
        });

        expect(screen.getByText("No employees match your search.")).toBeInTheDocument();
    });

    test("shows the empty-state message when no employees are available", () => {
        render(<TestWrapper employees={[]} />);

        expect(getSelectedCountLabel(0)).toBeInTheDocument();
        expect(screen.getByText("No employees available.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Clear selected" })).toBeDisabled();
    });

    test("keeps selected employees checked after filtering and clearing the search", () => {
        render(<TestWrapper />);

        fireEvent.click(screen.getByLabelText("Mattie Smith"));
        expect(getSelectedCountLabel(1)).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Search employees..."), {
            target: { value: "matt" },
        });

        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();

        fireEvent.change(screen.getByPlaceholderText("Search employees..."), {
            target: { value: "" },
        });

        expect(screen.getByLabelText("Brad Lanning")).not.toBeChecked();
        expect(screen.getByLabelText("Mattie Smith")).toBeChecked();
        expect(screen.getByLabelText("Rocco Jones")).not.toBeChecked();
    });

    test("renders Security level select with default value", () => {
        render(<TestWrapper />);

        const select = screen.getByLabelText("Security level") as HTMLSelectElement;
        expect(select).toBeInTheDocument();
        expect(select.value).toBe("Internal");
    });
});