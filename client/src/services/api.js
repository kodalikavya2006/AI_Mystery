const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) throw new Error(body.error?.message || 'Something went wrong. Please try again.');
  return body.data;
}

export const api = {
  create: payload => request('/mysteries', { method: 'POST', body: JSON.stringify(payload) }),
  history: () => request('/mysteries'),
  get: id => request(`/mysteries/${id}`),
  progress: (id, payload) => request(`/mysteries/${id}/progress`, { method: 'PATCH', body: JSON.stringify(payload) }),
  hint: (id, level) => request(`/mysteries/${id}/hints`, { method: 'POST', body: JSON.stringify({ level }) }),
  accuse: (id, suspectId) => request(`/mysteries/${id}/accusation`, { method: 'POST', body: JSON.stringify({ suspectId }) }),
  abandon: id => request(`/mysteries/${id}`, { method: 'DELETE' })
};
