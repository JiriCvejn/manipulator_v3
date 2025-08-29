<template>
  <div class="p-6 max-w-5xl mx-auto">
    <header class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Trasy (Routes)</h1>
      <button @click="reload" class="px-3 py-2 rounded border">Obnovit</button>
    </header>

    <!-- Výběr FROM -->
    <div class="bg-white border rounded p-4 mb-4">
      <div class="mb-2">
        <label class="block text-sm mb-1">ODKUD (FROM)</label>
        <select v-model="fromCode" class="border rounded px-2 py-1 w-64" @change="loadRoutes">
          <option disabled value="">-- vyber --</option>
          <option v-for="s in storages" :key="s.code" :value="s.code">
            {{ s.code }} – {{ s.name }}
          </option>
        </select>
      </div>

      <!-- Hromadné přidání TO -->
      <div v-if="fromCode" class="mt-3">
        <h3 class="font-semibold mb-2">Přidat cíle (TO) pro {{ fromCode }}</h3>
        <div class="flex items-center gap-2 mb-2">
          <input v-model="filterQ" placeholder="Filtrovat cíle..." class="border rounded px-2 py-1 w-64" />
          <button @click="toggleAll(true)" class="px-2 py-1 rounded border">Vybrat vše</button>
          <button @click="toggleAll(false)" class="px-2 py-1 rounded border">Zrušit výběr</button>
        </div>
        <div class="grid" :style="{display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:'6px'}">
          <label v-for="s in filteredCandidates" :key="s.code" class="border rounded px-2 py-1 flex items-center gap-2">
            <input type="checkbox" :value="s.code" v-model="toCodes" :disabled="s.code===fromCode" />
            <span class="font-mono">{{ s.code }}</span> – <span>{{ s.name }}</span>
          </label>
        </div>
        <div class="mt-3 flex justify-end">
          <button @click="saveBulk" :disabled="saving || toCodes.length===0" class="px-3 py-2 rounded bg-black text-white">
            {{ saving ? 'Ukládám…' : `Přidat ${toCodes.length} tras` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Seznam existujících tras -->
    <div class="bg-white border rounded">
      <div class="flex items-center justify-between p-3 border-b">
        <div class="font-semibold">Existující trasy</div>
        <div class="text-sm text-gray-500">FROM: {{ fromCode || '—' }}</div>
      </div>
      <table class="min-w-full">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="text-left p-2 w-20">ID</th>
            <th class="text-left p-2">FROM</th>
            <th class="text-left p-2">TO</th>
            <th class="text-right p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in routes" :key="r.id" class="border-b">
            <td class="p-2">{{ r.id }}</td>
            <td class="p-2 font-mono">{{ r.fromCode }}</td>
            <td class="p-2 font-mono">{{ r.toCode }}</td>
            <td class="p-2 text-right">
              <button @click="remove(r)" class="px-2 py-1 rounded border text-red-600">Smazat</button>
            </td>
          </tr>
          <tr v-if="!loading && routes.length===0">
            <td colspan="4" class="p-4 text-center text-gray-500">Žádné trasy.</td>
          </tr>
          <tr v-if="loading">
            <td colspan="4" class="p-4 text-center text-gray-500">Načítám…</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="error" class="text-red-600 mt-2">Chyba: {{ error }}</p>
    <p v-if="okMsg" class="text-green-600 mt-2">{{ okMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { listStorages } from "@/api/storages";
import { listRoutes, bulkCreateRoutes, deleteRoute, type RouteDto } from "@/api/routes";

type StorageDto = { id: number; code: string; name: string; type: string; active: boolean };

const storages = ref<StorageDto[]>([]);
const fromCode = ref<string>("");
const routes = ref<RouteDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const okMsg = ref<string | null>(null);

// výběr kandidátů TO
const filterQ = ref("");
const toCodes = ref<string[]>([]);
const saving = ref(false);

const candidates = computed(() => storages.value.filter(s => s.active));
const filteredCandidates = computed(() => {
  const q = filterQ.value.trim().toLowerCase();
  return candidates.value.filter(s => !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
});

function toggleAll(v: boolean) {
  if (v) {
    toCodes.value = filteredCandidates.value.map(s => s.code).filter(c => c !== fromCode.value);
  } else {
    toCodes.value = [];
  }
}

async function loadStorages() {
  try {
    storages.value = await listStorages();
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.message || "Load storages failed";
  }
}

async function loadRoutes() {
  if (!fromCode.value) { routes.value = []; return; }
  loading.value = true; error.value = null;
  try {
    routes.value = await listRoutes(fromCode.value);
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.message || "Load routes failed";
  } finally {
    loading.value = false;
  }
}

async function saveBulk() {
  if (!fromCode.value || toCodes.value.length === 0) return;
  saving.value = true; error.value = null; okMsg.value = null;
  try {
    const created = await bulkCreateRoutes(fromCode.value, toCodes.value);
    okMsg.value = `Přidáno ${created.length} tras.`;
    toCodes.value = [];
    await loadRoutes();
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.message || "Create routes failed";
  } finally {
    saving.value = false;
  }
}

async function remove(r: RouteDto) {
  const yes = confirm(`Smazat trasu ${r.fromCode} -> ${r.toCode}?`);
  if (!yes) return;
  try {
    await deleteRoute(r.id);
    routes.value = routes.value.filter(x => x.id !== r.id);
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || e?.message || "Delete failed");
  }
}

function reload() {
  loadStorages().then(loadRoutes);
}

onMounted(async () => {
  await loadStorages();
  // předvyber první aktivní storage jako FROM (pokud žádný není, nech prázdné)
  const first = storages.value.find(s => s.active);
  if (first) {
    fromCode.value = first.code;
    await loadRoutes();
  }
});
</script>

<style scoped>
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-semibold { font-weight: 600; }
.p-6 { padding: 1.5rem; }
.p-4 { padding: 1rem; }
.p-3 { padding: .75rem; }
.p-2 { padding: .5rem; }
.mb-4 { margin-bottom: 1rem; }
.rounded { border-radius: .375rem; }
.bg-white { background: #fff; }
.bg-gray-100 { background: #f3f4f6; }
.border { border: 1px solid #e5e7eb; }
.text-gray-500 { color: #6b7280; }
.text-green-600 { color:#16a34a; }
.text-red-600 { color:#dc2626; }
.min-w-full { min-width:100%; }
.mx-auto { margin-left:auto; margin-right:auto; }
.flex { display:flex; }
.items-center { align-items:center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.gap-2 { gap:.5rem; }
.w-64 { width: 16rem; }
.grid { display:grid; }
</style>
