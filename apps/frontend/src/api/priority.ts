// File: apps/frontend/src/api/priority.ts
import axios from './http';
export async function fetchPriorityRules() {
  const res = await axios.get('/priority-rules');
  return res.data;
}
export async function createPriorityRule(from: string, to: string, defaultUrgency: string, enabled: boolean) {
  return axios.post('/priority-rules', { from, to, defaultUrgency, enabled });
}
export async function updatePriorityRule(id: number, data: Partial<{defaultUrgency: string, enabled: boolean}>) {
  return axios.patch(`/priority-rules/${id}`, data);
}
export async function deletePriorityRule(id: number) {
  return axios.delete(`/priority-rules/${id}`);
}
