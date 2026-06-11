import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugins/router";

import "@mdi/font/css/materialdesignicons.css";
import "roboto-fontface/css/roboto/roboto-fontface.css";
// Self-hosted (P0004: the app must work offline against a private GitLab instance).
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist/700.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "@fontsource/roboto-mono/600.css";
import "@/styles/global.css";

import { completePendingSignIn, getActiveProvider } from "@/plugins/git";

async function bootstrap(): Promise<void> {
    // A redirect-based OAuth flow (GitLab) returns here with ?code=&state= and must be
    // completed before the router guard checks authentication.
    const signedIn = await completePendingSignIn();
    getActiveProvider().restoreSession();
    createApp(App).use(router).mount("#app");
    if (signedIn) {
        await router.push({ name: "Editor" });
    }
}

void bootstrap();
