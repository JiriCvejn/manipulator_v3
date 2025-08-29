<template>
  <div class="p-6 max-w-5xl mx-auto">
    <header class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Úložiště (Storages)</h1>
      <button @click="openCreate" class="px-3 py-2 rounded bg-black text-white">+ Nové</button>
    </header>

    <!-- FILTR / HLEDÁNÍ -->
    <div class="flex items-center gap-3 mb-3">
      <input v-model="q" placeholder="Hledat (code / name)" class="border rounded px-2 py-1 w-64" />
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="onlyActive" />
        Pouze aktivní
      </label>
    </div>

    <!-- TABULKA -->
    <div class="overflow-x-auto bg-white border rounded">
      <table class="min-w-full">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="text-left p-2">ID</th>
            <th class="text-left p-2">Kód</th>
            <th class="text-left p-2">Název</th>
            <th class="text-left p-2">Typ</th>
            <th class="text-left p-2">Aktivní</th>
            <th class="text-right p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" class="border-b">
            <td class="p-2">{{ s.id }}</td>
            <td class="p-2 font-mono">{{ s.code }}</td>
            <td class="p-2">{{ s.name }}</td>
            <td class="p-2">
              <span class="inline-block px-2 py-0.5 rounded bg-gray-100 border">{{ s.type }}</span>
            </td>
            <td class="p-2">
              <span :class="s.active ? 'text-green-600' : 'text-gray-400'">
                {{ s.active ? 'ANO' : 'NE' }}
              </span>
            </td>
            <td class="p-2 text-right">
              <button @click="openEdit(s)" class="px-2 py-1 rounded border mr-2">Upravit</button>
              <button @click="askDelete(s)" class="px-2 py-1 rounded border text-red-600">Smazat</button>
            </td>
          </tr>

          <tr v-if="!loading && filtered.length === 0">
            <td colspan="6" class="p-4 text-center text-gray-500">Žádná data.</td>
          </tr>
          <tr v-if="loading">
            <td colspan="6" class="p-4 text-center text-gray-500">Načítám…</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="error" class="text-red-600 mt-2">Chyba: {{ error }}</p>

    <!-- MODÁL CREATE/EDIT -->
    <div v-if="modalOpen" class="fixed inset-0 flex items-center justify-center" style="background: rgba(0,0,0,0.4);">
      <div class="bg-white rounded shadow p-4" style="width: 420px;">
        <h2 class="text-xl font-semibold mb-3">{{ editId ? 'Upravit úložiště' : 'Nové úložiště' }}</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-2">
            <label class="block text-sm">Kód</label>
            <input v-model.trim="form.code" :disabled="!!editId" required class="border rounded px-2 py-1 w-full" placeholder="např. A01" />
          </div>
          <div class="mb-2">
            <label class="block text-sm">Název</label>
            <input v-model.trim="form.name" required class="border rounded px-2 py-1 w-full" placeholder="Např. Paletové místo u linky 1" />
          </div>
          <div class="mb-2">
            <label class="block text-sm">Typ</label>
            <select v-model="form.type" required class="border rounded px-2 py-1 w-full">
              <option value="STORAGE">STORAGE</option>
              <option value="LINE">LINE</option>
              <option value="BUFFER">BUFFER</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" v-model="form.active" />
              Aktivní
            </label>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="closeModal" class="px-3 py-2 rounded border">Zrušit</button>
            <button type="submit" :disabled="saving" class="px-3 py-2 rounded bg-black text-white">
              {{ saving ? 'Ukládám…' : (editId ? 'Uložit' : 'Vytvořit') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODÁL DELETE -->
    <div v-if="confirmOpen" class="fixed inset-0 flex items-center justify-center" style="background: rgba(0,0,0,0.4);">
      <div class="bg-white rounded shadow p-4" style="width: 420px;">
        <h2 class="text-xl font-semibold mb-3">Smazat úložiště</h2>
        <p class="mb-4">Opravdu smazat <b>{{ toDelete?.code }}</b> – {{ toDelete?.name }}?</p>
        <div class="flex justify-end gap-2">
          <button @click="confirmOpen = false" class="px-3 py-2 rounded border">Ne</button>
          <button @click="doDelete" class="px-3 py-2 rounded bg-red-600 text-white">Ano, smazat</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import type { StorageDto, StorageCreateDto, StorageUpdateDto } from '@/api/storages';
import { listStorages, createStorage, updateStorage, deleteStorage } from '@/api/storages';

const items = ref<StorageDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const q = ref('');
const onlyActive = ref(false);

// modal state
const modalOpen = ref(false);
const saving = ref(false);
const editId = ref<number | null>(null);
const form = ref<Required<StorageCreateDto>>({
  code: '',
  name: '',
  type: 'STORAGE',
  active: true,
});

// delete state
const confirmOpen = ref(false);
const toDelete = ref<StorageDto | null>(null);

const filtered = computed(() => {
  const query = q.value.trim().toLowerCase();
  return items.value.filter(s => {
    const matchesQ = !query || s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
    const matchesActive = !onlyActive.value || s.active;
    return matchesQ && matchesActive;
  });
});

async function load() {
  loading.value = true; error.value = null;
  try {
    items.value = await listStorages();
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.message || 'Load failed';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  form.value = { code: '', name: '', type: 'STORAGE', active: true };
  modalOpen.value = true;
}
function openEdit(s: StorageDto) {
  editId.value = s.id;
  form.value = { code: s.code, name: s.name, type: s.type, active: s.active };
  modalOpen.value = true;
}
function closeModal() {
  modalOpen.value = false;
}

async function submitForm() {
  saving.value = true; error.value = null;
  try {
    if (editId.value) {
      const payload: StorageUpdateDto = {
        name: form.value.name,
        type: form.value.type,
        active: form.value.active,
      };
      const updated = await updateStorage(editId.value, payload);
      const idx = items.value.findIndex(i => i.id === editId.value);
      if (idx >= 0) items.value[idx] = updated;
    } else {
      const payload: StorageCreateDto = {
        code: form.value.code,
        name: form.value.name,
        type: form.value.type,
        active: form.value.active,
      };
      const created = await createStorage(payload);
      items.value.unshift(created);
    }
    modalOpen.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

function askDelete(s: StorageDto) {
  toDelete.value = s;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await deleteStorage(toDelete.value.id);
    items.value = items.value.filter(i => i.id !== toDelete.value!.id);
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || e?.message || 'Delete failed');
  } finally {
    confirmOpen.value = false;
    toDelete.value = null;
  }
}

onMounted(load);
</script>

<style scoped>
/* jednoduché utility, pokud Tailwind není aktivní */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-semibold { font-weight: 600; }
.p-6 { padding: 1.5rem; }
.p-4 { padding: 1rem; }
.p-2 { padding: .5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: .75rem; }
.rounded { border-radius: .375rem; }
.bg-white { background: #fff; }
.bg-black { background: #111827; }
.bg-gray-100 { background: #f3f4f6; }
.border { border: 1px solid #e5e7eb; }
.text-white { color: #fff; }
.text-red-600 { color:#dc2626; }
.text-gray-500 { color: #6b7280; }
.text-gray-400 { color: #9ca3af; }
.text-green-600 { color: #16a34a; }
.mx-auto { margin-left:auto; margin-right:auto; }
.max-w-5xl { max-width: 64rem; }
.w-full { width: 100%; }
.flex { display:flex; }
.items-center { align-items:center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.gap-2 { gap:.5rem; }
.gap-3 { gap:.75rem; }
.inline-block { display:inline-block; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.overflow-x-auto { overflow-x:auto; }
.min-w-full { min-width:100%; }
.fixed { position:fixed; }
.inset-0 { inset:0; }
.shadow { box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.1); }
.px-2 { padding-left:.5rem; padding-right:.5rem; }
.py-1 { padding-top:.25rem; padding-bottom:.25rem; }
.px-3 { padding-left:.75rem; padding-right:.75rem; }
.py-2 { padding-top:.5rem; padding-bottom:.5rem; }
.mr-2 { margin-right:.5rem; }
</style>
