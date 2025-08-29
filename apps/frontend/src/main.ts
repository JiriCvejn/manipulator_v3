import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// ať případná chyba neskončí bílou stránkou
app.config.errorHandler = (err) => {
  console.error("[Vue Error]", err);
  const el = document.getElementById("fatal");
  if (el) el.textContent = String(err);
};

app.mount("#app");

