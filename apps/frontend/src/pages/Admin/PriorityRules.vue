<!-- File: apps/frontend/src/pages/Admin/PriorityRules.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Pravidla urgentnosti</h1>
    <div class="mb-4 flex space-x-2">
      <input v-model="newFrom" placeholder="ODKUD (code)" class="p-1 border rounded" />
      <input v-model="newTo" placeholder="KAM (code)" class="p-1 border rounded" />
      <select v-model="newUrgency" class="p-1 border rounded">
        <option value="STANDARD">STANDARD</option>
        <option value="URGENT">URGENT</option>
      </select>
      <button @click="addRule" class="px-3 py-1 bg-green-600 text-white rounded">Přidat pravidlo</button>
    </div>
    <table class="min-w-full bg-white border">
      <thead class="bg-gray-100">
        <tr><th class="p-2 text-left">ODKUD</th><th class="p-2 text-left">KAM</th><th class="p-2 text-left">Výchozí urgence</th><th class="p-2 text-left">Aktivní</th><th class="p-2"></th></tr>
      </thead>
      <tbody>
        <tr v-for="rule in rules" :key="rule.id" class="border-t">
          <td class="p-2">{{ rule.from }}</td>
          <td class="p-2">{{ rule.to }}</td>
          <td class="p-2">{{ rule.defaultUrgency }}</td>
          <td class="p-2">
            <input type="checkbox" v-model="rule.enabled" @change="toggleRule(rule)" />
          </td>
          <td class="p-2 text-right">
            <button @click="removeRule(rule)" class="text-red-600 hover:underline">Smazat</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchPriorityRules, createPriorityRule, updatePriorityRule, deletePriorityRule } from '@/api/priority';
import { useUIStore } from '@/store/ui';

const rules = ref<Array<any>>([]);
const newFrom = ref("");
const newTo = ref("");
const newUrgency = ref("STANDARD");
const uiStore = useUIStore();

async function loadRules() {
  rules.value = await fetchPriorityRules();
}
async function addRule() {
  try {
    const res = await createPriorityRule(newFrom.value, newTo.value, newUrgency.value, true);
    uiStore.addToast("Pravidlo přidáno", "success");
    newFrom.value = ""; newTo.value = ""; newUrgency.value = "STANDARD";
    loadRules();
  } catch (err) { }
}
async function toggleRule(rule: any) {
  try {
    await updatePriorityRule(rule.id, { enabled: rule.enabled });
    uiStore.addToast("Pravidlo aktualizováno", "success");
  } catch (err) { }
}
async function removeRule(rule: any) {
  if (!confirm("Odstranit pravidlo urgentnosti?")) return;
  try {
    await deletePriorityRule(rule.id);
    uiStore.addToast("Pravidlo odstraněno", "success");
    loadRules();
  } catch (err) { }
}
onMounted(loadRules);
</script>
