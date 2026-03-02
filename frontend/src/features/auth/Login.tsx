import LoginView from "./LoginView";
import { useLoginController } from "./useLoginController";

export default function Login() {
    const controller = useLoginController();
    return <LoginView {...controller} />;
}
