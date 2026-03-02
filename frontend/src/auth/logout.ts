import { NavigateFunction } from "react-router-dom";
import { tokenStore } from "./tokens";

export const logout = (navigate: NavigateFunction) => {
    tokenStore.clear();
    navigate("/login");
};
