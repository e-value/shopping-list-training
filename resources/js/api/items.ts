import type { Item } from '../types/item'
import apiClient from './client'

export function listItems() {
  return apiClient.get<Item[]>('/items')
}

export function getItem(id: number) {
  return apiClient.get<Item>(`/items/${id}`)
}

export function createItem(data: { product_name: string; quantity: number; priority: number }) {
  return apiClient.post<Item>('/items', data)
}

export function deleteItem(id: number) {
  return apiClient.delete(`/items/${id}`)
}
