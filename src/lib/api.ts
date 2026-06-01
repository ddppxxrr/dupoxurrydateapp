const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  getMemories: () => fetch(`${BASE_URL}/api/memories`).then(r => r.json()),
  addMemory: (data: any) => fetch(`${BASE_URL}/api/memories`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  updateMemory: (id: string, data: any) => fetch(`${BASE_URL}/api/memories/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  deleteMemory: (id: string) => fetch(`${BASE_URL}/api/memories/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getPhotos: (category: string) => fetch(`${BASE_URL}/api/photos?category=${category}`).then(r => r.json()),
  addPhoto: (data: any) => fetch(`${BASE_URL}/api/photos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  deletePhoto: (id: string) => fetch(`${BASE_URL}/api/photos/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getSettings: () => fetch(`${BASE_URL}/api/settings`).then(r => r.json()),
  updateSettings: (data: any) => fetch(`${BASE_URL}/api/settings`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
};
