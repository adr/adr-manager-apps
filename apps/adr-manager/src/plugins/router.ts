import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import LandingPage from "@/views/LandingPage.vue";
import EditorView from "@/views/EditorView.vue";
import ErrorPage from "@/views/ErrorPage.vue";
import { lsGet } from "@/plugins/storage";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "Register",
        alias: ["/register", "/login"],
        component: LandingPage,
        meta: {
            title: () => "ADR Manager - Connect"
        }
    },
    {
        path: "/manager",
        alias: ["/editor"],
        name: "Editor",
        meta: { requiresAuth: true },
        redirect: (to) => {
            const p = to.params;
            if (p["organization"] && p["repo"] && p["branch"] && p["adr"]) {
                return { name: "EditorWithSpecifiedAdr" };
            } else if (p["organization"] && p["repo"] && p["branch"]) {
                return { name: "EditorWithSpecifiedRepo" };
            }
            return { name: "EditorUnspecified" };
        }
    },
    {
        path: "/manager",
        name: "EditorUnspecified",
        component: EditorView,
        meta: { requiresAuth: true },
        props: (route) => ({ ...route.query, ...route.params })
    },
    {
        path: "/manager/:organization/:repo/:branch",
        name: "EditorWithSpecifiedRepo",
        component: EditorView,
        meta: { requiresAuth: true },
        props: (route) => ({
            ...route.query,
            ...route.params,
            repoFullName: `${route.params["organization"]}/${route.params["repo"]}`,
            branch: route.params["branch"]
        })
    },
    {
        path: "/manager/:organization/:repo/:branch/:adr",
        name: "EditorWithSpecifiedAdr",
        component: EditorView,
        meta: {
            requiresAuth: true,
            title: (route) => String(route.params["adr"])
        },
        props: (route) => ({
            ...route.query,
            ...route.params,
            repoFullName: `${route.params["organization"]}/${route.params["repo"]}`,
            branch: route.params["branch"],
            adr: route.params["adr"]
        })
    },
    {
        path: "/:pathMatch(.*)*",
        name: "Error 404",
        component: ErrorPage
    }
];

const router = createRouter({
    // The app runs under a static sub-path and has no SPA server fallback, so hash history
    // preserves the existing URL scheme (e.g. /adr-manager-apps/#/manager).
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, _from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!lsGet("authId")) {
            next({ path: "/login", query: { redirect: to.fullPath } });
        } else {
            next();
        }
    } else {
        next();
    }
});

const DEFAULT_TITLE = "ADR Manager";
router.afterEach((to) => {
    document.title = to.meta.title ? to.meta.title(to) : DEFAULT_TITLE;
});

export default router;
