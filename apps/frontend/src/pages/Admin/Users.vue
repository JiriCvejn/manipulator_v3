<template>
  <div>
    <h1>Uživatelé</h1>

    <div class="toolbar">
      <input v-model="search" placeholder="Hledat (username/role)" />
      <label><input type="checkbox" v-model="onlyActive" /> Pouze aktivní</label>
      <button @click="load()" :disabled="loading">Obnovit</button>
      <button @click="openCreate()">+ Nový</button>
    </div>

    <div v-if="error" class="error">Chyba: {{ error }}</div>

    <table v-if="users.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Uživatel</th>
          <th>Role</th>
          <th>Aktivní</th>
          <th>Vytvořen</th>
          <th>Akce</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.role }}</td>
          <td>{{ u.active ? "✔" : "—" }}</td>
          <td>{{ fmt(u.createdAt) }}</td>
          <td class="actions">
            <button @click="openEdit(u)">Upravit</button>
            <button class="danger" @click="remove(u)">Smazat</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>Žádná data.</p>

    <!-- Modal -->
    <div v-if="modal.open" class="overlay" @click.self="closeModal()">
      <div class="card">
        <h3 v-if="modal.mode==='create'">Nový uživatel</h3>
        <h3 v-else>Upravit uživatele</h3>

        <label>
          Username
          <input v-model="form.username" />
        </label>

        <label>
          Role
          <select v-model="form.role">
            <option value="admin">admin</option>
            <option value="operator">operator</option>
            <option value="worker">worker</option>
          </select>
        </label>

        <label>
          Aktivní
          <input type="checkbox" v-model="form.active" />
        </label>

        <label>
          Heslo
          <input v-model="form.password" :placeholder="modal.mode==='edit' ? '(ponech prázdné – beze změny)' : ''" />
        </label>

        <div class="actions">
          <button @click="closeModal()">Zrušit</button>
          <button class="primary" @click="save()" :disabled="saving">
            {{ modal.mode==='create' ? 'Vytvořit' : 'Uložit' }}
          </button>
        </div>

        <div v-if="formError" class="error">{{ formError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { fetchUsers, createUser, updateUser, deleteUser, type UserVm } from "@/api/users";

const users = ref<UserVm[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const search = ref("");
const onlyActive = ref(true);

const modal = reactive<{ open: boolean; mode: "create" | "edit"; user?: UserVm }>({ open: false, mode: "create" });
const form = reactive<{ username: string; role: UserVm["role"]; active: boolean; password: string }>({
  username: "",
  role: "operator",
  active: true,
  password: ""
});
const saving = ref(false);
const formError = ref<string | null>(null);

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("cs-CZ"); } catch { return iso; }
}

async function load() {
  try {
    loading.value = true;
    error.value = null;
    users.value = await fetchUsers({ search: search.value || undefined, active: onlyActive.value ? true : undefined });
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message ?? e.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  modal.open = true; modal.mode = "create"; modal.user = undefined;
  form.username = ""; form.role = "operator"; form.active = true; form.password = "";
  formError.value = null;
}
function openEdit(u: UserVm) {
  modal.open = true; modal.mode = "edit"; modal.user = u;
  form.username = u.username; form.role = u.role; form.active = u.active; form.password = "";
  formError.value = null;
}
function closeModal(){ modal.open = false; }

async function save() {
  try {
    saving.value = true; formError.value = null;

    if (modal.mode === "create") {
      if (!form.password) { formError.value = "Heslo je povinné"; return; }
      await createUser({ username: form.username.trim(), role: form.role, active: form.active, password: form.password });
    } else if (modal.user) {
      const payload: any = { username: form.username.trim(), role: form.role, active: form.active };
      if (form.password) payload.password = form.password; // jen pokud chceš změnit
      await updateUser(modal.user.id, payload);
    }

    closeModal();
    await load();
  } catch (e: any) {
    formError.value = e?.response?.data?.error?.message ?? e.message ?? String(e);
  } finally {
    saving.value = false;
  }
}

async function remove(u: UserVm) {
  if (!confirm(`Smazat uživatele ${u.username}?`)) return;
  try {
    await deleteUser(u.id);
    await load();
  } catch (e: any) {
    alert(e?.response?.data?.error?.message ?? e.message ?? String(e));
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar { display:flex; gap:8px; align-items:center; margin-bottom:12px; }
.toolbar input[type="text"], .toolbar input[placeholder] { padding:6px 8px; }
.table { width:100%; border-collapse: collapse; background:#fff; border-radius:8px; overflow:hidden; }
.table th, .table td { padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:left; }
.table thead th { background:#f3f4f6; }
.actions { display:flex; gap:6px; }
button { padding:6px 10px; border:0; border-radius:6px; background:#e5e7eb; cursor:pointer; }
button.primary { background:#2563eb; color:#fff; }
button.danger { background:#ef4444; color:#fff; }
.error { color:#b91c1c; margin-top:8px; }

.overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; }
.card { background:#fff; padding:16px; border-radius:8px; width:360px; display:flex; flex-direction:column; gap:10px; }
.card input, .card select { width:100%; padding:6px 8px; border:1px solid #e5e7eb; border-radius:6px; }
.card .actions { display:flex; justify-content:flex-end; gap:8px; margin-top:6px; }
</style>
