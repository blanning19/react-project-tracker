import EditView from "./EditView";
import { useEditController } from "./useEditController";

const Edit = () => {
    const { control, formState: { errors }, handleSubmit, submission, projectManagers, employees, loading, apiError } = useEditController();
    return <EditView control={control} errors={errors} handleSubmit={handleSubmit} submission={submission} projectManagers={projectManagers} employees={employees} loading={loading} apiError={apiError} />;
};

export default Edit;
