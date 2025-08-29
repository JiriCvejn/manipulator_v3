<!-- File: apps/frontend/src/pages/Admin/LayoutEditor.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Editor rozložení</h1>
    <div class="grid grid-cols-12 gap-1 mb-4">
      <div v-for="(cell, index) in flattenedGrid" :key="index" 
           class="aspect-square border" 
           :class="cell.active ? 'bg-green-500 text-white' : 'bg-gray-300'" 
           @click="toggleCell(cell)">
        <div class="text-center text-sm" v-if="cell.active">
          {{ cell.storageCode || '?' }}
        </div>
      </div>
    </div>
    <div class="mb-4">
      <div v-if="selectedCell" class="p-2 bg-gray-100 rounded mb-2">
        <h2 class="font-medium">Slot ({{ selectedCell.row+1 }}, {{ selectedCell.col+1 }})</h2>
        <div class="mt-2">
          <label>Kód úložiště: </label>
          <input v-model="selectedCell.storageCode" class="p-1 border rounded" />
          <label class="ml-2">Label: </label>
          <input v-model="selectedCell.label" maxlength="1" class="p-1 border rounded w-12 text-center" />
        </div>
      </div>
      <button @click="saveLayout" class="px-4 py-2 bg-blue-600 text-white rounded">Uložit layout</button>
      <span v-if="saveMsg" class="ml-2 text-green-600">{{ saveMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import axios from '@/api/http';
import { useUIStore } from '@/store/ui';
const uiStore = useUIStore();

const grid = reactive<any[]>([]);
const selectedCell = ref<any>(null);
const flattenedGrid = computed(() => grid.flat());

function toggleCell(cell: any) {
  cell.active = !cell.active;
  if (cell.active) {
    // default values
    cell.storageCode = "";
    cell.label = "";
    selectedCell.value = cell;
  } else {
    // clear values if deactivated
    cell.storageCode = "";
    cell.label = "";
    if (selectedCell.value === cell) {
      selectedCell.value = null;
    }
  }
}
async function loadLayout() {
  const res = await axios.get('/layout');
  const data = res.data;
  grid.length = 0;
  for (let i = 0; i < 12; i++) {
    const row = [];
    for (let j = 0; j < 12; j++) {
      row.push({ row: i, col: j, active: false, storageCode: "", label: "" });
    }
    grid.push(row);
  }
  if (data && data.grid) {
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const cell = data.grid[i][j];
        if (cell.active) {
          grid[i][j].active = true;
          grid[i][j].storageCode = cell.storageCode;
          grid[i][j].label = cell.label;
        }
      }
    }
  }
}
async function saveLayout() {
  try {
    const payload = { grid: JSON.parse(JSON.stringify(grid)) };
    await axios.post('/layout', payload);
    uiStore.addToast("Layout uložen", "success");
    saveMsg.value = "Uloženo";
    setTimeout(() => saveMsg.value = "", 3000);
  } catch (err) { }
}
const saveMsg = ref("");
onMounted(loadLayout);
</script>
