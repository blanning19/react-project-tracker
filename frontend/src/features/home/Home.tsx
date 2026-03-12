/**
 * @file Home page wiring component.
 *
 * @module home/Home
 */

import HomeView from "./HomeView";
import { useHomeController } from "./useHomeController";

/**
 * Wires {@link useHomeController} directly to {@link HomeView}.
 *
 * @returns The rendered Home page.
 */
function Home(): JSX.Element {
    const props = useHomeController();
    /** Pass all of the props in to HomeView */
    return <HomeView {...props} />;
}

export default Home;