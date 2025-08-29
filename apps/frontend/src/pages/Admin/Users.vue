<!-- File: apps/frontend/src/pages/Admin/Users.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Uživatelé</h1>
    <div class="mb-4 space-x-2">
      <input v-model="newUsername" placeholder="Uživatel" class="p-1 border rounded" />
      <input v-model="newPassword" placeholder="Heslo" type="password" class="p-1 border rounded" />
      <select v-model="newRole" class="p-1 border rounded">
        <option value="operator">Operátor</option>
        <option value="worker">Manipulant</option>
        <option value="admin">Admin</option>
      </select>
      <input v-model="newHomeStorage" placeholder="Home úložiště (volit.)" class="p-1 border rounded" />
      <button @click="addUser" class="px-3 py-1 bg-green-600 text-white rounded">Přidat</button>
    </div>
    <table class="min-w-full bg-white border">
      <thead class="bg-gray-100">
        <tr><th class="p-2 text-left">Uživatel</th><th class="p-2">Role</th><th class="p-2">Aktivní</th><th class="p-2">Home</th><th class="p-2"></th></tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="border-t">
          <td class="p-2">{{ user.username }}</td>
          <td class="p-2 text-center">{{ user.role }}</td>
          <td class="p-2 text-center">
            <input type="checkbox" v-model="user.active" @change="toggleActive(user)" />
          </td>
          <td class="p-2 text-center">{{ user.homeStorageCode || '' }}</td>
          <td class="p-2 text-right">
            <button @click="resetPwd(user)" class="text-blue-600 hover:underline mr-2">Reset hesla</button>
            <button @click="removeUser(user)" class="text-red-600 hover:underline">Smazat</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchUsers, createUser, updateUser, resetPassword, deleteUser } from '@/api/users';
import { useUIStore } from '@/store/ui';
const users = ref<Array<any>>([]);
const newUsername = ref(""); const newPassword = ref("");
const newRole = ref("operator"); const newHomeStorage = ref("");
const uiStore = useUIStore();

async function loadUsers() {
  users.value = await fetchUsers();
}
async function addUser() {
  try {
    await createUser(newUsername.value, newPassword.value, newRole.value, newHomeStorage.value || null);
    uiStore.addToast("Uživatel vytvořen", "success");
    newUsername.value = ""; newPassword.value = ""; newHomeStorage.value = ""; newRole.value = "operator";
    loadUsers();
  } catch (err) { }
}
async function toggleActive(user: any) {
  try {
    await updateUser(user.id, { active: user.active });
    uiStore.addToast(`Uživatel ${user.active ? 'aktivován' : 'deaktivován'}`, "success");
  } catch (err) { }
}
async function resetPwd(user: any) {
  const pwd = prompt(`Nové heslo pro ${user.username}:`);
  if (!pwd) return;
  try {
    await resetPassword(user.id, pwd);
    uiStore.addToast("Heslo resetováno", "success");
  } catch (err) { }
}
async function removeUser(user: any) {
  if (!confirm(`Opravdu smazat uživatele ${user.username}?`)) return;
  try {
    await deleteUser(user.id);
    uiStore.addToast("Uživatel odstraněn", "success");
    loadUsers();
  } catch (err) { }
}
onMounted(loadUsers);
</script>
