import axios from './http';

export interface StorageDto {
  id: number;
  code: string;       // např. "A01"
  name: string;       // název lokace
  type: 'STORAGE' | 'LINE' | 'BUFFER';
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorageCreateDto {
  code: string;
  name: string;
  type: 'STORAGE' | 'LINE' | 'BUFFER';
  active?: boolean;
}

export interface StorageUpdateDto {
  name?: string;
  type?: 'STORAGE' | 'LINE' | 'BUFFER';
  active?: boolean;
}

export async function listStorages(): Promise<StorageDto[]> {
  const { data } = await axios.get('/storages');
  return data;
}

export async function createStorage(payload: StorageCreateDto): Promise<StorageDto> {
  const { data } = await axios.post('/storages', payload);
  return data;
}

export async function updateStorage(id: number, payload: StorageUpdateDto): Promise<StorageDto> {
  const { data } = await axios.patch(`/storages/${id}`, payload);
  return data;
}

export async function deleteStorage(id: number): Promise<void> {
  await axios.delete(`/storages/${id}`);
}
