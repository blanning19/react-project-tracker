import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../features/home/Home";
import { useHomeController } from "../features/home/useHomeController";

/**
 * Mock the Home controller so this test can focus only on the container
 * behavior of the Home component.
 */
vi.mock("../features/home/useHomeController", () => ({
    useHomeController: vi.fn(),
}));

/**
 * Mock the HomeView component so we can easily verify the props it receives
 * from the Home container without depending on its real rendering.
 */
vi.mock("../features/home/HomeView", () => ({
    default: (props: Record<string, unknown>) => (
        <div>
            <div data-testid="home-view">Mock HomeView</div>
            <pre data-testid="home-view-props">{JSON.stringify(props)}</pre>
        </div>
    ),
}));

describe("Home", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("calls useHomeController and passes the controller result into HomeView", () => {
        const mockController = {
            loading: false,
            apiError: "",
            searchQuery: "",
            total: 2,
            totalPages: 1,
            safePage: 1,
            start: 0,
            end: 10,
            page: 1,
            pageSize: 10,
            pageRows: [],
            sortIcon: vi.fn(),
            getData: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            onSearchChange: vi.fn(),
            toggleSort: vi.fn(),
        };

        vi.mocked(useHomeController).mockReturnValue(mockController);

        render(<Home />);

        expect(useHomeController).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("home-view")).toBeInTheDocument();
        expect(screen.getByTestId("home-view-props")).toHaveTextContent(
            JSON.stringify(mockController)
        );
    });
});