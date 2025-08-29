<!-- File: apps/frontend/src/pages/Operator/View.vue -->
<template>
  <div class="p-4">
    <!-- Info box if layout missing -->
    <div v-if="!layoutLoaded" class="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded">
      Načítám rozložení slotů...
    </div>
    <div v-else-if="grid.length === 0" class="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded">
      <strong>Rozložení není nastaveno.</strong> Nastav v Admin → Layouty.
    </div>

    <!-- Grid of slots -->
    <div class="grid grid-cols-12 gap-1 mb-4">
      <button v-for="(cell, index) in flattenedGrid" :key="index"
              :disabled="!cell.active || !cell.storageCodeValid"
              @click="selectFrom(cell)"
              :class="tileClass(cell)">
        {{ cell.label || ' ' }}
        <!-- badges for count and urgency -->
        <span v-if="cell.count > 0" class="badge top-right">{{ cell.ageMinutes }}m</span>
        <span v-if="cell.count > 1" class="badge bottom-right">● {{ cell.count }}</span>
        <span v-if="cell.hasUrgent" class="badge top-left">⚠️</span>
      </button>
    </div>

    <!-- If from selected (State B) show possible destinations -->
    <div v-if="selectedFrom" class="mb-4">
      <h2 class="font-medium mb-2">Vybrané ODKUD: {{ selectedFrom.storageCode }}</h2>
      <div v-if="destinations.length">
        <div class="grid grid-cols-4 gap-2">
          <button v-for="dest in destinations" :key="dest.to"
                  class="bg-orange-200 hover:bg-orange-300 p-2 rounded text-center"
                  @click="chooseDestination(dest.to)">
            {{ dest.to }} – {{ dest.name }}
          </button>
        </div>
      </div>
      <div v-else class="bg-gray-100 p-2 rounded text-gray-700">
        Pro tento ODKUD nejsou definovány trasy. Oprav v Admin → Trasy.
      </div>
    </div>

    <!-- Confirmation overlay -->
    <div v-if="confirmVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div class="bg-white p-6 rounded max-w-sm w-full">
        <h3 class="text-lg font-bold mb-4">Potvrdit objednávku</h3>
        <p class="mb-2">Odvoz z: <strong>{{ selectedFrom?.storageCode }}</strong></p>
        <p class="mb-2">Přívoz do: <strong>{{ selectedTo }}</strong></p>
        <label class="block mb-2">
          Poznámka (volitelně):
          <input v-model="note" type="text" class="mt-1 p-2 border rounded w-full" />
        </label>
        <div class="flex items-center mb-4">
          <input id="urgCheck" type="checkbox" v-model="urgentFlag" class="mr-2" />
          <label for="urgCheck">Urgentní převoz</label>
        </div>
        <div class="text-right">
          <button @click="confirmVisible=false" class="mr-2 px-4 py-2 bg-gray-300 rounded">Zrušit</button>
          <button @click="submitOrder" class="px-4 py-2 bg-green-600 text-white rounded">Objednat</button>
        </div>
      </div>
    </div>

    <!-- Bottom visual (background layers) -->
    <div class="mt-8 relative h-24">
      <div class="absolute inset-x-0 top-0 h-2 bg-yellow-400"></div>
      <div class="absolute inset-x-0 top-2 h-14 bg-gray-500"></div>
      <div class="absolute inset-x-0 top-16 h-1 bg-white"></div>
      <div class="absolute inset-x-0 bottom-0 h-6 bg-blue-600"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import { fetchSlotMetrics, createOrder, fetchRoutes } from '@/api/orders';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { useUIStore as useUI } from '@/store/ui';
import axios from '@/api/http';

interface CellState {
  active: boolean;
  storageCode?: string;
  label?: string;
  storageCodeValid: boolean;
  count: number;
  hasUrgent: boolean;
  ageMinutes: number;
}

// Local component state
const grid = reactive<CellState[][]>([]);
const destinations = ref<any[]>([]);
const selectedFrom = ref<CellState|null>(null);
const selectedTo = ref<string>("");
const confirmVisible = ref(false);
const note = ref("");
const urgentFlag = ref(false);

// Pinia stores
const uiStore = useUIStore();
const authStore = useAuthStore();

// Flattened grid for ease of iteration
const flattenedGrid = computed(() => grid.flat());

// Helper to compute classes for a slot button based on state
function tileClass(cell: CellState) {
  let cls = "relative aspect-square text-sm font-medium rounded flex items-center justify-center ";
  if (!cell.active) {
    cls += "bg-gray-300 cursor-default";
  } else if (!cell.storageCodeValid) {
    cls += "bg-gray-400 cursor-not-allowed"; // invalid storage code
  } else if (cell.count > 0) {
    cls += "bg-green-600 text-white";
    if (cell.hasUrgent) {
      // urgent tasks exist
      cls += " outline outline-2 outline-red-500";
    } else if (cell.ageMinutes >= 15) {
      cls += " outline outline-2 outline-red-400";
    } else if (cell.ageMinutes >= 5) {
      cls += " outline outline-2 outline-amber-400";
    }
    // slight overlay to darken (for any queue state)
    cls += " after:absolute after:inset-0 after:bg-black/30 after:rounded";
  } else {
    cls += "bg-green-500 text-white hover:bg-green-600";
  }
  return cls;
}

// Select a source slot (ODKUD)
async function selectFrom(cell: CellState) {
  if (!cell.active || !cell.storageCode || !cell.storageCodeValid) return;
  selectedFrom.value = cell;
  // Fetch available destinations for this from
  const routes = await fetchRoutes(cell.storageCode);
  // Filter only existing routes
  destinations.value = routes.filter((r: any) => r.status === 'exists');
  // After picking ODKUD, remain in state B until user resets or logs out
}

// Choose destination (KAM) and show confirmation
async function chooseDestination(toCode: string) {
  selectedTo.value = toCode;
  // Determine default urgency from priority rules if any
  // (We could fetch all priority rules on mount and filter, but for simplicity call an endpoint or assume it's included in /routes data not in this case.)
  // Here, as an example, we fetch priority rules in background and find one:
  try {
    const res = await axios.get('/priority-rules');
    const rules = res.data;
    const rule = rules.find((r: any) => r.fromCode === selectedFrom.value?.storageCode && r.toCode === toCode && r.enabled);
    if (rule) {
      urgentFlag.value = (rule.defaultUrgency === 'URGENT');
    } else {
      urgentFlag.value = uiStore.urgent; // use the toggle state as fallback
    }
  } catch {
    urgentFlag.value = uiStore.urgent;
  }
  confirmVisible.value = true;
}

// Submit the order (create new Order)
async function submitOrder() {
  if (!selectedFrom.value) return;
  try {
    await createOrder(selectedFrom.value.storageCode!, selectedTo.value, urgentFlag.value ? 'URGENT' : 'STANDARD', note.value);
    uiStore.addToast("Objednávka vytvořena", "success");
    // After creating, clear KAM and note, keep the same ODKUD (State B persists)
    selectedTo.value = "";
    note.value = "";
    confirmVisible.value = false;
    // refresh metrics manually (the SSE will also update eventually)
    updateMetrics();
  } catch (err) {
    // error toasts handled by interceptor
  }
}

// Load layout and initial data
async function loadLayout() {
  try {
    const res = await axios.get('/layout');
    const layoutData = res.data;
    if (layoutData && layoutData.grid) {
      // build grid state
      grid.length = 0;
      for (let i = 0; i < layoutData.grid.length; i++) {
        const row = layoutData.grid[i];
        const stateRow: CellState[] = row.map((cell: any) => ({
          active: cell.active,
          storageCode: cell.storageCode,
          label: cell.label,
          storageCodeValid: true, // will validate below
          count: 0,
          hasUrgent: false,
          ageMinutes: 0
        }));
        grid.push(stateRow);
      }
      // Validate storage codes in layout against storages list
      const storagesRes = await axios.get('/storages');
      const storagesList = storagesRes.data;
      const codeSet = new Set(storagesList.map((s: any) => s.code));
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (cell.active) {
            if (!codeSet.has(cell.storageCode!)) {
              cell.storageCodeValid = false;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to load layout:", err);
  } finally {
    layoutLoaded.value = true;
  }
}

// Periodically update metrics
async function updateMetrics() {
  try {
    const metrics = await fetchSlotMetrics();
    // Reset all counts
    for (const row of grid) {
      for (const cell of row) {
        cell.count = 0; cell.hasUrgent = false; cell.ageMinutes = 0;
      }
    }
    for (const m of metrics) {
      // find cell by storageCode = m.from
      for (const row of grid) {
        const cell = row.find(c => c.active && c.storageCode === m.from);
        if (cell) {
          cell.count = m.count;
          cell.hasUrgent = m.hasUrgent;
          cell.ageMinutes = Math.floor(m.ageMinutes);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch metrics:", err);
  }
}

// SSE setup for realtime events
function initSSE() {
  const source = new EventSource(`${import.meta.env.VITE_API_URL}/events?role=operator&home=${authStore.user?.homeStorageCode || ''}`, { withCredentials: true });
  source.addEventListener('metrics.updated', e => {
    const data = JSON.parse(e.data);
    // Update a single slot metric
    const cell = flattenedGrid.value.find(c => c.active && c.storageCode === data.from);
    if (cell) {
      cell.count = data.count;
      cell.hasUrgent = data.hasUrgent;
      cell.ageMinutes = data.ageMinutes;
    }
  });
  source.addEventListener('order.status_changed', e => {
    // We may refresh metrics fully on status changes if needed
    updateMetrics();
  });
  source.onerror = () => {
    uiStore.addToast("Ztracené spojení – připojuji...", "error");
  };
}

const layoutLoaded = ref(false);
onMounted(async () => {
  await loadLayout();
  updateMetrics();
  initSSE();
  // Poll metrics every 30s as fallback
  setInterval(updateMetrics, 30000);
});
</script>

<style scoped>
.badge {
  position: absolute;
  font-size: 10px;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border-radius: 3px;
}
.top-right { top: 2px; right: 2px; }
.bottom-right { bottom: 2px; right: 2px; }
.top-left { top: 2px; left: 2px; }
</style>
