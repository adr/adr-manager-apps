import "./commands";
import "@cypress/code-coverage/support";

export const TEST_BASE_URL = "http://localhost:8000/adr-manager-apps/#/manager";
export const REST_LIST_REPO_URL = "**/user/repos**";
export const REST_REPO_URL = "**/repos/**";
export const REST_BRANCH_URL = "**/repos/**/branches/**";
export const REST_COMMIT_URL = "**/repos/**/git/commits?**";
