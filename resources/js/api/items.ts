import apiClient from './client';

export function listItems() {
  return apiClient.get('/items');
}

export function getItem(id) {
  return apiClient.get(`/items/${id}`);
}

export function createItem(data) {
  return apiClient.post('/items', data);
}

export function deleteItem(id) {
  return apiClient.delete(`/items/${id}`);
}
