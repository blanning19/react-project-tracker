/**
 * @file Home page wiring component.
 *
 * @module home/Home
 */

import { useHomeController } from "./useHomeController";
import HomeView from "./HomeView";

/**
 * Wires {@link useHomeController} to {@link HomeView}.
 *
 * This component intentionally stays thin — all logic lives in the controller
 * and all rendering lives in the view. The controller returns a grouped prop
 * shape (rows, pagination, sort, filters, state, actions, navigation) which
 * is spread directly into the view.
 *
 * @returns The rendered Home page.
 */
function Home(): JSX.Element {
    const props = useHomeController();
    return <HomeView {...props} />;
}

export default Home;
