import CreateView from "./CreateView";
import { useCreateController } from "./useCreateController";

const Create = () => {
    const { control, formState: { errors }, handleSubmit, submission, projectManagers, employees, loading, apiError } = useCreateController();
    return <CreateView control={control} errors={errors} handleSubmit={handleSubmit} submission={submission} projectManagers={projectManagers} employees={employees} loading={loading} apiError={apiError} />;
};

export default Create;
