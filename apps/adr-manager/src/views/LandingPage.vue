<template>
    <div class="landing">
        <header class="landing-topbar">
            <div class="brand">
                <img src="../assets/logo-badge.png" alt="ADR Manager" />
                <span class="word">ADR<span> Manager</span></span>
            </div>
            <span class="spacer"></span>
            <a href="https://github.com/adr/adr-manager" target="_blank" class="github-link">
                View on GitHub
                <span class="mdi mdi-open-in-new" aria-hidden="true"></span>
            </a>
        </header>

        <main class="hero">
            <img class="hero-logo" src="../assets/logo-badge.png" alt="" />
            <h1>Manage your Architectural Decision Records</h1>
            <p>
                Architectural Decision Records are a way to quickly write down Architectural Decisions. <br />
                This tool is meant to make the editing and management of ADRs on GitHub and GitLab easier.
            </p>
            <div class="connect-actions">
                <ProviderSignInButton provider="github" label="Connect to GitHub" icon="github" />
                <button type="button" class="btn btn-primary connect-btn" @click="showGitLabDialog = true">
                    <span class="mdi mdi-gitlab" aria-hidden="true"></span>
                    Connect to GitLab
                </button>
            </div>
        </main>
    </div>

    <DialogConnectGitLab v-model="showGitLabDialog" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import DialogConnectGitLab from "@/components/DialogConnectGitLab.vue";
import ProviderSignInButton from "@/components/ProviderSignInButton.vue";

const showGitLabDialog = ref(false);
</script>

<style scoped>
.landing {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--adr-surface-1);
}

.landing-topbar {
    height: 60px;
    flex: 0 0 60px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
    background: var(--adr-surface);
    border-bottom: 1px solid var(--adr-line);
}

.brand {
    display: flex;
    align-items: center;
    gap: 11px;
}

.brand img {
    width: 32px;
    height: 32px;
    display: block;
}

.brand .word {
    font-size: 18px;
    font-weight: 700;
    color: var(--adr-navy);
    letter-spacing: 0.2px;
}

.brand .word span {
    font-weight: 400;
    color: var(--adr-ink-2);
}

.github-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
}

.github-link .mdi {
    font-size: 16px;
}

.hero {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 14px;
    padding: 0 24px 80px;
}

.hero-logo {
    width: 72px;
    height: 72px;
}

.hero h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 600;
    color: var(--adr-navy);
    letter-spacing: -0.02em;
}

.hero p {
    margin: 0 0 10px;
    color: var(--adr-ink-2);
    font-size: 15px;
    line-height: 1.6;
}

.connect-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
}

.connect-btn {
    height: 44px;
    padding: 0 22px;
    font-size: 14px;
}

.connect-btn .mdi {
    font-size: 20px;
}
</style>
