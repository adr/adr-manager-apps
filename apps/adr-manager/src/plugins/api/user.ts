import axios from "axios";
import { BASE_URL_USER } from "./config";
import { request } from "./request";
import type { GitHubEmail, GitHubUser } from "@/types/github";

export async function getUserEmail(): Promise<GitHubEmail[] | undefined> {
    return request(axios.get<GitHubEmail[]>(`${BASE_URL_USER}/public_emails`));
}

export async function getUserName(): Promise<GitHubUser | undefined> {
    return request(axios.get<GitHubUser>(BASE_URL_USER));
}
