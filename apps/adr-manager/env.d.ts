/// <reference types="vite/client" />

import "vue-router";

declare module "vue-router" {
    interface RouteMeta {
        requiresAuth?: boolean;
        title?: (route: import("vue-router").RouteLocationNormalized) => string;
    }
}
