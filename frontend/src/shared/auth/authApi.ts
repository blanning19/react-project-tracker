import FetchInstance from "../http/fetchClient";
import { isCookieAuth } from "./mode";
import { tokenStore } from "./tokens";

export interface LoginResponse {
    access?: string;
    refresh?: string;
}

export const loginRequest = async (
    username: string,
    password: string
): Promise<LoginResponse> => {
    const response = await FetchInstance.post<LoginResponse>("auth/login/", {
        username,
        password,
    });

    return response.data;
};

export const logoutRequest = async (): Promise<void> => {
    const refresh = isCookieAuth ? undefined : tokenStore.getRefresh();
    await FetchInstance.post("auth/logout/", refresh ? { refresh } : {});
};