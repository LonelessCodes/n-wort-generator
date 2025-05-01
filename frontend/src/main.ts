import "@fontsource/changa-one";
import "@fontsource/abril-fatface";
import "@fontsource/sigmar-one";
import "@fontsource/fugaz-one";
import "@fontsource-variable/grandstander";
import "@fontsource-variable/pixelify-sans";

import "@csstools/normalize.css";
import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

createApp(App).use(createPinia()).mount("#app");
