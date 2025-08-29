<template>
  <div class="p-4 max-w-sm mx-auto">
    <h1>Login</h1>
    <form @submit.prevent="submit">
      <div>
        <label>Uživatel</label>
        <input v-model="username" />
      </div>
      <div>
        <label>Heslo</label>
        <input type="password" v-model="password" />
      </div>
      <button :disabled="auth.loading">Přihlásit</button>
      <p v-if="auth.error" style="color:red">{{ auth.error }}</p>
    </form>

    <p class="mt-2">
      <router-link to="/operator">Přeskočit na Operátora (demo)</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const auth = useAuthStore();
const router = useRouter();

const username = ref('admin');
const password = ref('admin');

async function submit() {
  try {
    await auth.login(username.value, password.value);
    // přesměrování dle role
    if (auth.user?.role === 'admin') {
      return router.push('/admin/storages');
    }
    if (auth.user?.role === 'operator') {
      return router.push('/operator');
    }
    return router.push('/worker/tasks');
  } catch {
    // chyba se už propíše do auth.error
  }
}
</script>
