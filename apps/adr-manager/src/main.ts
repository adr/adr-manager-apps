import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugins/router";
import vuetify from "./plugins/vuetify";

import VueTippy from "vue-tippy";
import "tippy.js/dist/tippy.css";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@/styles/global.css";

import { vAutowidth } from "./directives/autowidth";
import { setHeaders } from "./plugins/apiConfig/config";

setHeaders();

createApp(App)
    .use(router)
    .use(vuetify)
    .use(VueTippy, { directive: "tippy" })
    .directive("autowidth", vAutowidth)
    .mount("#app");
