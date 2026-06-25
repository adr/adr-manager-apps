<template>
    <BaseDialog
        :model-value="reconnectVisible"
        title="Session expired"
        icon="key-alert"
        :width="440"
        @update:model-value="cancel"
    >
        <p>Your GitHub session expired. Reconnect to pick up where you left off.</p>
        <template #actions>
            <button type="button" class="btn btn-text-success" :disabled="connecting" @click="reconnect">
                {{ connecting ? "Reconnecting…" : "Reconnect to GitHub" }}
            </button>
            <button type="button" class="btn btn-text-error" :disabled="connecting" @click="cancel">Cancel</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";
import { reconnectVisible, settleReauth } from "@/plugins/git/providers/github/reauth";
import { prewarmGitHubAuth, signInWithGitHubPopup } from "@/plugins/git/providers/github/auth";
import { useToast } from "@/composables/useToast";

const { showErrorToast } = useToast();
const connecting = ref(false);

// Warm the Firebase modules while the dialog is up so the popup opens within the click gesture.
watch(reconnectVisible, (visible) => {
    if (visible) {
        prewarmGitHubAuth();
    }
});

async function reconnect(): Promise<void> {
    connecting.value = true;
    try {
        await signInWithGitHubPopup();
        settleReauth(true);
    } catch (error) {
        console.error(error);
        showErrorToast("Could not reconnect to GitHub. Please try again.");
        settleReauth(false);
    } finally {
        connecting.value = false;
    }
}

function cancel(): void {
    settleReauth(false);
}
</script>
