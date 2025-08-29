import axios, { http } from './http';

// --- Typy (zjednodušené) ---
export interface RouteDto {
  id: number;
  fromCode: string;
  toCode: string;
  active: boolean;
}
export interface MetricDto {
  from: string;         // sklad (ODKUD)
  count: number;        // počet objednávek
  hasUrgent: boolean;   // existuje urgent?
  oldestCreatedAt: string | null;
  ageMinutes: number | null;
}
export interface OrderDto {
  id: number;
  fromCode: string;
  toCode: string;
  urgency: 'STANDARD' | 'URGENT';
  note?: string | null;
  status: 'new' | 'in_progress' | 'done' | 'canceled';
  assigneeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  takenAt?: string | null;
  doneAt?: string | null;
  canceledAt?: string | null;
}
export interface OrderCreateDto {
  from: string;
  to: string;
  urgency: 'STANDARD' | 'URGENT';
  note?: string;
}

// --- API volání používaná v aplikaci ---

// Admin/Operator – seznam tras
export async function fetchRoutes(): Promise<RouteDto[]> {
  const { data } = await http.get<RouteDto[]>('/routes');
  return data;
}

// Operátor – metriky slotů (group by from_code)
export async function fetchSlotMetrics(
  status: 'new' | 'in_progress' | 'done' | 'canceled' = 'new'
): Promise<MetricDto[]> {
  const { data } = await http.get<MetricDto[]>('/orders/metrics', { params: { status } });
  return data;
}

// Operátor – založení objednávky
export async function createOrder(payload: OrderCreateDto): Promise<OrderDto> {
  const { data } = await http.post<OrderDto>('/orders', payload);
  return data;
}

// Worker – fronta úkolů (default status=new)
export async function fetchOrdersQueue(
  status: 'new' | 'in_progress' | 'done' | 'canceled' = 'new'
): Promise<OrderDto[]> {
  const { data } = await http.get<OrderDto[]>('/orders', { params: { status } });
  return data;
}

// Worker – vzít úkol
export async function takeOrder(id: number): Promise<OrderDto> {
  const { data } = await http.post<OrderDto>(`/orders/${id}/take`);
  return data;
}

// Worker – dokončit úkol
export async function completeOrder(id: number): Promise<OrderDto> {
  const { data } = await http.post<OrderDto>(`/orders/${id}/done`);
  return data;
}

// Worker/Admin/Operator – zrušit úkol
export async function cancelOrder(id: number, reason?: string): Promise<OrderDto> {
  const { data } = await http.post<OrderDto>(`/orders/${id}/cancel`, { reason });
  return data;
}
