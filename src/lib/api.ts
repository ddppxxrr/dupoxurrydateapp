const BASE_URL = import.meta.env.VITE_API_URL || '';

const fetchApi = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
};

export const api = {
  getMemories: () => fetchApi(`${BASE_URL}/api/memories`),
  addMemory: (data: any) => fetchApi(`${BASE_URL}/api/memories`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
  updateMemory: (id: string, data: any) => fetchApi(`${BASE_URL}/api/memories/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
  deleteMemory: (id: string) => fetchApi(`${BASE_URL}/api/memories/${id}`, { method: 'DELETE' }),
  
  getPhotos: (category: string) => fetchApi(`${BASE_URL}/api/photos?category=${category}`),
  addPhoto: (data: any) => fetchApi(`${BASE_URL}/api/photos`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
  deletePhoto: (id: string) => fetchApi(`${BASE_URL}/api/photos/${id}`, { method: 'DELETE' }),

  getSettings: () => fetchApi(`${BASE_URL}/api/settings`),
  updateSettings: (data: any) => fetchApi(`${BASE_URL}/api/settings`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
};
