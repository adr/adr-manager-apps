import { createApp } from "vue";
import App from "./App.vue";
import router from "./plugins/router";

import "@mdi/font/css/materialdesignicons.css";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@/styles/global.css";

import { setHeaders } from "./plugins/api";

setHeaders();

createApp(App).use(router).mount("#app");
