import HomeView from "./HomeView";
import { useHomeController } from "./useHomeController";

const Home = () => {
    const controller = useHomeController();
    return <HomeView {...controller} />;
};

export default Home;
