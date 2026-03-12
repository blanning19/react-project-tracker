export interface TimelineTask
{
    id: number;
    title: string;
    status: string;
}

export default class TaskViewModel
{
    private static instance: TaskViewModel | null = null;

    public timelineTaskList: Array<TimelineTask> = [];

    private constructor()
    {
    }

    public static GetInstance(): TaskViewModel
    {
        if (!TaskViewModel.instance)
        {
            TaskViewModel.instance = new TaskViewModel();
        }

        return TaskViewModel.instance;
    }

    public setTimelineTaskList(tasks: Array<TimelineTask>): void
    {
        this.timelineTaskList = tasks;
    }
}
