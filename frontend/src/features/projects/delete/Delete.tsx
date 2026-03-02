import DeleteView from "./DeleteView";
import { useDeleteController } from "./useDeleteController";

const Delete = () => {
    const controller = useDeleteController();
    return <DeleteView {...controller} />;
};

export default Delete;
