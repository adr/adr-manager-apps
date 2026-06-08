/// <reference types="vite/client" />

import "vue-router";

// Side-effect-only style entry point that ships no type declaration.
declare module "vuetify/styles";

declare module "vue-router" {
    interface RouteMeta {
        requiresAuth?: boolean;
        title?: (route: import("vue-router").RouteLocationNormalized) => string;
    }
}
