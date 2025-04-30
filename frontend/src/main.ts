import "@fontsource/changa-one";
import "@fontsource/abril-fatface";

import "@csstools/normalize.css";
import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

createApp(App).use(createPinia()).mount("#app");
