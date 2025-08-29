import { defineStore } from 'pinia';

interface State {
  urgent: boolean;
  operatorHome: string | null; // např. A01
}

export const useUiStore = defineStore('ui', {
  state: (): State => ({
    urgent: false,
    operatorHome: null,
  }),
  actions: {
    toggleUrgent() { this.urgent = !this.urgent; },
    setOperatorHome(code: string | null) { this.operatorHome = code; }
  }
});

// ⬇️ alias kvůli importům ve tvaru useUIStore (s velkým I)
export const useUIStore = useUiStore;
