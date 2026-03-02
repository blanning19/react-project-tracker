import HomeView from "./HomeView";
import { useHomeController } from "./useHomeController";

/**
 * Container component for the Home feature.
 *
 * Responsibilities:
 * - call the Home controller hook to gather page state and behaviors
 * - pass the prepared controller output into the presentational HomeView
 *
 * This keeps page logic out of the rendering layer and makes the view easier
 * to maintain, test, and evolve independently.
 */
function Home(): JSX.Element {
    /**
     * The controller owns Home page state, derived values, event handlers,
     * and side effects such as loading project data.
     */
    const controller = useHomeController();

    return <HomeView {...controller} />;
}

export default Home;