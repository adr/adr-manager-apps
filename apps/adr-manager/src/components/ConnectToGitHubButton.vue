<template>
    <button type="button" class="btn btn-primary connect-btn" @click="hasAuthId">
        <span class="mdi mdi-github" aria-hidden="true"></span>
        Connect to GitHub
    </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { signInWithPopup, GithubAuthProvider, getAdditionalUserInfo } from "firebase/auth";
import { auth, GithubProvider } from "@/plugins/firebase/client";
import { lsGet, lsSet } from "@/plugins/storage";

const router = useRouter();

function hasAuthId(): void {
    if (lsGet("authId") === null) {
        void signInWithGithub();
    } else {
        void router.push({ name: "Editor" });
    }
}

async function signInWithGithub(): Promise<void> {
    GithubProvider.addScope("repo read:user gist workflow read:org");
    try {
        const result = await signInWithPopup(auth, GithubProvider);
        const credential = GithubAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
            return;
        }
        lsSet("authId", credential.accessToken);
        lsSet("user", getAdditionalUserInfo(result)?.username ?? "");
        void router.push({ name: "Editor" });
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
