<template>
    <button type="button" class="btn btn-primary connect-btn" @click="handleConnectClick">
        <span class="mdi" :class="`mdi-${icon}`" aria-hidden="true"></span>
        {{ label }}
    </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { getProvider, setActiveProvider } from "@/plugins/git";
import type { GitProviderId } from "@/types/git";

const props = defineProps<{ provider: GitProviderId; label: string; icon: string }>();

const router = useRouter();

async function handleConnectClick(): Promise<void> {
    const provider = getProvider(props.provider);
    if (provider.isAuthenticated()) {
        setActiveProvider(props.provider);
        router.push({ name: "Editor" });
        return;
    }
    try {
        // A redirect-based flow (GitLab) navigates away here and never resolves.
        await provider.signIn();
        router.push({ name: "Editor" });
    } catch (error) {
        console.error("SignIn Error", error);
    }
}
</script>

<style scoped>
.connect-btn {
    height: 44px;
    padding: 0 22px;
    font-size: 14px;
}

.connect-btn .mdi {
    font-size: 20px;
}
</style>
