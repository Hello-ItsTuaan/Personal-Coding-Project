async function jsonFetch(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed: ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

function makeEntity(resource) {
  return {
    list: () => jsonFetch(`/api/${resource}`),
    create: (payload) => jsonFetch(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
    update: (id, payload) => jsonFetch(`/api/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload ?? {}) }),
    delete: (id) => jsonFetch(`/api/${resource}/${id}`, { method: 'DELETE' }),
  }
}

export const base44 = {
  auth: {
    me: () => jsonFetch('/api/auth/me'),
    logout: () => {
      // no-op for self-host local mode
    },
    redirectToLogin: () => {
      // no-op for self-host local mode
    },
  },
  entities: {
    Subject: makeEntity('subjects'),
    Grade: makeEntity('grades'),
    Goal: makeEntity('goals'),
  },
  integrations: {
    Core: {
      InvokeLLM: (payload) => jsonFetch('/api/llm/invoke', { method: 'POST', body: JSON.stringify(payload ?? {}) }),
    },
  },
}
