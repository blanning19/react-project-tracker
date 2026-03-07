import { useHomeController } from "./useHomeController";
import HomeView from "./HomeView";

/**
 * Home page — wires the controller hook to the view.
 *
 * useHomeController returns a grouped shape (rows, pagination, sort,
 * filters, state, actions) which is spread directly into HomeView.
 * This file intentionally stays thin — all logic lives in the controller
 * and all rendering lives in the view.
 */
function Home(): JSX.Element {
    const props = useHomeController();
    return <HomeView {...props} />;
}

export default Home;
