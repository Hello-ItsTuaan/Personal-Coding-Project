import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { create, list, remove, update } from './db.js'

const app = express()
app.disable('x-powered-by')

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/auth/me', (_req, res) => res.json({ email: 'local@home', name: 'Local User' }))

function crudRoutes(resource, table) {
  app.get(`/api/${resource}`, async (_req, res) => {
    res.json(await list(table))
  })

  app.post(`/api/${resource}`, async (req, res) => {
    res.status(201).json(await create(table, req.body ?? {}))
  })

  app.put(`/api/${resource}/:id`, async (req, res) => {
    const row = await update(table, req.params.id, req.body ?? {})
    if (!row) return res.status(404).json({ error: 'not_found' })
    res.json(row)
  })

  app.delete(`/api/${resource}/:id`, async (req, res) => {
    const ok = await remove(table, req.params.id)
    if (!ok) return res.status(404).json({ error: 'not_found' })
    res.json({ ok: true })
  })
}

crudRoutes('subjects', 'subjects')
crudRoutes('grades', 'grades')
crudRoutes('goals', 'goals')

app.post('/api/llm/invoke', async (_req, res) => {
  // Base44 had an LLM integration. For self-host, wire this to OpenAI (server-side) if you want.
  res.status(501).json({
    error: 'not_implemented',
    message: 'LLM integration not configured. Implement /api/llm/invoke or remove the AI button.',
  })
})

const distDir = path.resolve(process.cwd(), 'dist')
const distIndex = path.join(distDir, 'index.html')
if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(distIndex))
}

const port = Number.parseInt(process.env.PORT ?? '8787', 10)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})

