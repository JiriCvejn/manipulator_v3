<template>
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell; color:#111827">
    <header style="background:#111827;color:#fff;padding:10px 14px;display:flex;gap:12px;align-items:center">
      <strong style="margin-right:auto">Manipulator FE</strong>
      <RouterLink to="/login" style="color:#cbd5e1;text-decoration:none">Login</RouterLink>
      <RouterLink to="/admin/storages" style="color:#cbd5e1;text-decoration:none">Storages</RouterLink>
      <RouterLink to="/admin/routes" style="color:#cbd5e1;text-decoration:none">Routes</RouterLink>
      <RouterLink to="/admin/users" style="color:#cbd5e1;text-decoration:none">Users</RouterLink>
      <span style="opacity:.8">{{ time }}</span>
    </header>
    <main style="padding:16px">
      <RouterView />
      <pre id="fatal" style="color:#b91c1c; margin-top:16px;"></pre>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { ref, onMounted, onBeforeUnmount } from "vue";
const time = ref("");
function tick(){ time.value = new Date().toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"}); }
let t:number|undefined;
onMounted(()=>{ tick(); t = window.setInterval(tick, 60000); });
onBeforeUnmount(()=>{ if (t) clearInterval(t); });
</script>
