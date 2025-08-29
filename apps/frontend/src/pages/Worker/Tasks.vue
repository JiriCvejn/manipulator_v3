<!-- File: apps/frontend/src/pages/Worker/Tasks.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Fronta úkolů</h1>
    <div class="mb-6">
      <h2 class="font-semibold mb-2">Moje mise</h2>
      <div v-if="currentTask" class="p-4 bg-white rounded shadow flex items-center justify-between">
        <div>
          <p><strong>Odvoz:</strong> {{ currentTask.fromCode }} → <strong>Přívoz:</strong> {{ currentTask.toCode }}</p>
          <p v-if="currentTask.urgency === 'URGENT'" class="text-red-600 font-bold">URGENTNÍ!</p>
          <p v-if="currentTask.note">Poznámka: {{ currentTask.note }}</p>
        </div>
        <div>
          <button @click="completeTask(currentTask)" class="px-4 py-2 bg-green-600 text-white rounded mr-2">Dokončit</button>
          <button @click="cancelTask(currentTask)" class="px-4 py-2 bg-gray-400 text-white rounded">Zrušit</button>
        </div>
      </div>
      <p v-else class="italic text-gray-600">Žádná aktivní mise.</p>
    </div>

    <h2 class="font-semibold mb-2">Čekající úkoly</h2>
    <div v-if="tasks.length">
      <div v-for="order in tasks" :key="order.id" class="mb-2 p-4 bg-white rounded shadow flex items-center justify-between">
        <div>
          <p>#{{ order.id }}: {{ order.fromCode }} → {{ order.toCode }}</p>
          <p v-if="order.urgency === 'URGENT'" class="text-red-600 font-bold">URGENTNÍ</p>
          <p v-if="order.note">Pozn.: {{ order.note }}</p>
        </div>
        <div>
          <button @click="takeTask(order)" class="px-3 py-1 bg-blue-600 text-white rounded mr-2">Převzít</button>
          <button @click="cancelTask(order)" class="px-3 py-1 bg-red-600 text-white rounded">Smazat</button>
        </div>
      </div>
    </div>
    <p v-else class="italic text-gray-600">Žádné úkoly k dispozici.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchOrdersQueue, takeOrder, completeOrder, cancelOrder } from '@/api/orders';
import { useUIStore } from '@/store/ui';
const tasks = ref<Array<any>>([]);
const currentTask = ref<any>(null);
const uiStore = useUIStore();

async function loadTasks() {
  tasks.value = await fetchOrdersQueue();
  // Determine if currentTask (in_progress for this user) exists
  // For simplicity, not filtering by assignee here, assume separate call if needed.
  // We could fetch /orders?status=in_progress&assigneeId=... if API existed.
  // Instead, just check global tasks list for any in_progress by this user, but queue fetch returns only new.
  // Possibly call separate endpoint or skip and trust SSE for assignment.
}
async function takeTask(order: any) {
  try {
    const res = await takeOrder(order.id);
    currentTask.value = res.data;
    // Remove from new tasks list
    tasks.value = tasks.value.filter(o => o.id !== order.id);
    uiStore.addToast("Úkol převzat", "success");
  } catch (err) { }
}
async function completeTask(order: any) {
  try {
    await completeOrder(order.id);
    uiStore.addToast("Úkol dokončen", "success");
    currentTask.value = null;
    // Optionally refresh list
    loadTasks();
  } catch (err) { }
}
async function cancelTask(order: any) {
  if (!confirm("Opravdu zrušit tento úkol?")) return;
  try {
    await cancelOrder(order.id, "User canceled");
    uiStore.addToast("Úkol zrušen", "success");
    if (order.status === 'new') {
      tasks.value = tasks.value.filter(o => o.id !== order.id);
    } else {
      // if canceling current in_progress
      currentTask.value = null;
    }
  } catch (err) { }
}

// SSE for realtime updates
function initSSE() {
  const source = new EventSource(`${import.meta.env.VITE_API_URL}/events?role=worker&userId=`, { withCredentials: true });
  source.addEventListener('order.created', e => {
    const order = JSON.parse(e.data);
    // Prepend urgent orders to top
    if (order.status === 'new') {
      if (order.urgency === 'URGENT') {
        tasks.value.unshift(order);
      } else {
        tasks.value.push(order);
      }
    }
  });
  source.addEventListener('order.status_changed', e => {
    const data = JSON.parse(e.data);
    if (currentTask.value && data.id === currentTask.value.id) {
      // if current task got canceled by admin perhaps
      if (data.status === 'canceled') {
        uiStore.addToast("Vaše mise byla zrušena správcem", "error");
        currentTask.value = null;
      }
    }
    // If any new tasks were canceled by others, remove from list
    if (data.status === 'in_progress' || data.status === 'canceled') {
      tasks.value = tasks.value.filter(o => o.id !== data.id);
    }
  });
  source.onerror = () => {
    // possibly display offline notice
  };
}

onMounted(() => {
  loadTasks();
  initSSE();
  // Optionally poll tasks periodically
  setInterval(loadTasks, 30000);
});
</script>
