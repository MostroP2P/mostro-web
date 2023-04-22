import type { App } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import { registerPlugins } from "./plugins";

export default {
  install: (app: App) => {
    registerPlugins(app);
    app.component(HelloWorld.name, HelloWorld);
  },
};
