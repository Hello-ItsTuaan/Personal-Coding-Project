import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const dataDir = path.resolve(process.cwd(), 'server', 'data')
const dbPath = path.join(dataDir, 'db.json')

let writeLock = Promise.resolve()

async function ensureDbFile() {
  await fs.mkdir(dataDir, { recursive: true })
  try {
    await fs.access(dbPath)
  } catch {
    const initial = { subjects: [], grades: [], goals: [] }
    await fs.writeFile(dbPath, JSON.stringify(initial, null, 2), 'utf8')
  }
}

async function readDb() {
  await ensureDbFile()
  const raw = await fs.readFile(dbPath, 'utf8')
  return JSON.parse(raw)
}

async function writeDb(nextDb) {
  await ensureDbFile()
  await fs.writeFile(dbPath, JSON.stringify(nextDb, null, 2), 'utf8')
}

function withLock(fn) {
  writeLock = writeLock.then(fn, fn)
  return writeLock
}

export async function list(table) {
  const db = await readDb()
  return db[table] ?? []
}

export async function create(table, data) {
  return withLock(async () => {
    const db = await readDb()
    const now = new Date().toISOString()
    const row = { id: randomUUID(), created_at: now, updated_at: now, ...data }
    db[table] = Array.isArray(db[table]) ? db[table] : []
    db[table].push(row)
    await writeDb(db)
    return row
  })
}

export async function update(table, id, patch) {
  return withLock(async () => {
    const db = await readDb()
    db[table] = Array.isArray(db[table]) ? db[table] : []
    const index = db[table].findIndex((r) => r.id === id)
    if (index === -1) return null
    const now = new Date().toISOString()
    db[table][index] = { ...db[table][index], ...patch, id, updated_at: now }
    await writeDb(db)
    return db[table][index]
  })
}

export async function remove(table, id) {
  return withLock(async () => {
    const db = await readDb()
    db[table] = Array.isArray(db[table]) ? db[table] : []
    const before = db[table].length
    db[table] = db[table].filter((r) => r.id !== id)
    await writeDb(db)
    return db[table].length !== before
  })
}

