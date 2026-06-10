import axios from "axios";
import { lsGet } from "@/plugins/storage";

export const BASE_URL_USER = "https://api.github.com/user";
export const BASE_URL_REPO = "https://api.github.com/repos";

/** Injects the GitHub OAuth token (from localStorage) as the default Bearer header. */
export function setHeaders(): void {
    axios.defaults.headers.common["Authorization"] = `Bearer ${lsGet("authId")}`;
}
