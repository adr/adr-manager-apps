<template>
    <BaseDialog v-model="show" title="Connect to GitLab" icon="gitlab" :width="480">
        <p class="hint">Sign in with GitLab.com, or connect to a self-hosted instance.</p>

        <label class="toggle">
            <input v-model="selfHosted" type="checkbox" class="toggle-checkbox" />
            Self-hosted instance
        </label>

        <template v-if="selfHosted">
            <label class="field-label" for="gitlab-base-url">Base URL</label>
            <input id="gitlab-base-url" v-model="baseUrl" class="field" placeholder="https://gitlab.example.com" />

            <label class="field-label" for="gitlab-client-id">Application ID</label>
            <input
                id="gitlab-client-id"
                v-model="clientId"
                class="field"
                placeholder="OAuth application ID registered by your administrator"
            />

            <p class="hint small">
                Requires GitLab 15.1 or newer and an OAuth application (scope <code>api</code>, not confidential) whose
                redirect URI is exactly <code>{{ redirectUri }}</code
                >.
            </p>
        </template>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <template #actions>
            <button type="button" class="btn btn-text-success" @click="connect">Connect</button>
            <button type="button" class="btn btn-text-error" @click="show = false">Cancel</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import BaseDialog from "./BaseDialog.vue";
import { getProvider, setActiveProvider } from "@/plugins/git";
import { oauthRedirectUri } from "@/plugins/git/providers/gitlab/config";
import { lsGet, lsRemove, lsSet } from "@/plugins/storage";

const show = defineModel<boolean>({ default: false });

const router = useRouter();

const selfHosted = ref(false);
const baseUrl = ref("");
const clientId = ref("");
const errorMessage = ref("");
const skipReachabilityCheck = ref(false);
const redirectUri = oauthRedirectUri();

watch(show, (open) => {
    if (!open) {
        return;
    }
    const storedBaseUrl = lsGet("gitlabBaseUrl");
    selfHosted.value = storedBaseUrl !== null;
    baseUrl.value = storedBaseUrl ?? "";
    clientId.value = lsGet("gitlabClientId") ?? "";
    errorMessage.value = "";
    skipReachabilityCheck.value = false;
});

function normalizeBaseUrl(input: string): string | null {
    const trimmed = input.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(trimmed)) {
        return null;
    }
    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        return null;
    }
}

async function isReachable(instanceBaseUrl: string): Promise<boolean> {
    try {
        await axios.get(`${instanceBaseUrl}/.well-known/openid-configuration`, { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

async function connect(): Promise<void> {
    errorMessage.value = "";

    if (selfHosted.value) {
        const normalized = normalizeBaseUrl(baseUrl.value);
        if (!normalized) {
            errorMessage.value = "Please enter a valid http(s) base URL.";
            return;
        }
        if (!clientId.value.trim()) {
            errorMessage.value = "Please enter the OAuth application ID for your instance.";
            return;
        }
        if (!skipReachabilityCheck.value && !(await isReachable(normalized))) {
            skipReachabilityCheck.value = true;
            errorMessage.value =
                "The instance could not be reached. This can mean a wrong URL, GitLab older than 15.1, " +
                "or an untrusted certificate. Press Connect again to try anyway.";
            return;
        }
        lsSet("gitlabBaseUrl", normalized);
        lsSet("gitlabClientId", clientId.value.trim());
    } else {
        lsRemove("gitlabBaseUrl");
        lsRemove("gitlabClientId");
    }

    const provider = getProvider("gitlab");
    if (provider.isAuthenticated()) {
        setActiveProvider("gitlab");
        router.push({ name: "Editor" });
        return;
    }
    try {
        // Navigates away to the GitLab authorize page.
        await provider.signIn();
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : String(error);
    }
}
</script>

<style scoped>
.hint {
    margin: 0 0 12px;
    color: var(--adr-ink-2);
}

.hint.small {
    font-size: 12px;
    margin-top: 8px;
    overflow-wrap: anywhere;
}

.toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 12px;
    cursor: pointer;
}

.toggle-checkbox {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
}

.field-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--adr-ink-2);
    margin: 10px 0 4px;
}

.error {
    margin: 12px 0 0;
    color: var(--adr-error);
    font-size: 13px;
}
</style>
