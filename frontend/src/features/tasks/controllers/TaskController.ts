import TaskViewModel from "../models/ViewModel";

/**
 * Stub task controller for dashboard data loading.
 */
class TaskController
{
    public static getTaskList(): void
    {
        const viewModel = TaskViewModel.GetInstance();

        viewModel.setTimelineTaskList([
            { id: 1, title: "Approve package A", status: "Pending" },
            { id: 2, title: "Complete readiness check", status: "In Progress" },
            { id: 3, title: "Review subject area summary", status: "Complete" },
        ]);
    }
}

export default TaskController;
