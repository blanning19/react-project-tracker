import { tokenStore } from "./tokens";

export function logout(navigate) {
    tokenStore.clear();
    navigate("/login");
}
