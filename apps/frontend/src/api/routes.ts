import axios from "@/api/http";

export interface RouteDto {
  id: number;
  fromCode: string;
  toCode: string;
}

export async function listRoutes(fromCode?: string): Promise<RouteDto[]> {
  const params: any = {};
  if (fromCode) params.fromCode = fromCode;
  const { data } = await axios.get("/routes", { params });
  return data;
}

export async function createRoute(fromCode: string, toCode: string): Promise<RouteDto> {
  const { data } = await axios.post("/routes", { fromCode, toCode });
  return data;
}

export async function bulkCreateRoutes(fromCode: string, toCodes: string[]): Promise<RouteDto[]> {
  const { data } = await axios.post("/routes/bulk", { fromCode, toCodes });
  return data;
}

export async function deleteRoute(id: number): Promise<void> {
  await axios.delete(`/routes/${id}`);
}
