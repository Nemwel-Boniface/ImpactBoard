/**
 * Local file-based KV store for development when Vercel KV credentials aren't set.
 * Persists data to .kv-data.json in the project root.
 */

import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), '.kv-data.json')

function readStore(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, unknown>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2))
}

class LocalKV {
  async get<T>(key: string): Promise<T | null> {
    const store = readStore()
    const entry = store[key] as { value: T; expiresAt?: number } | undefined
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      const s = readStore()
      delete s[key]
      writeStore(s)
      return null
    }
    return entry.value
  }

  async set<T>(key: string, value: T, opts?: { ex?: number }): Promise<void> {
    const store = readStore()
    store[key] = {
      value,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
    }
    writeStore(store)
  }

  async del(...keys: string[]): Promise<void> {
    const store = readStore()
    for (const key of keys) delete store[key]
    writeStore(store)
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const list = (await this.get<T[]>(key)) ?? []
    if (stop === -1) return list.slice(start)
    return list.slice(start, stop + 1)
  }

  async lpush(key: string, ...values: unknown[]): Promise<void> {
    const list = (await this.get<unknown[]>(key)) ?? []
    list.unshift(...values.reverse())
    await this.set(key, list)
  }

  async lrem(key: string, _count: number, value: unknown): Promise<void> {
    const list = (await this.get<unknown[]>(key)) ?? []
    await this.set(
      key,
      list.filter(v => v !== value)
    )
  }

  pipeline() {
    const ops: Array<() => Promise<unknown>> = []
    const pipe = {
      get: (key: string) => { ops.push(() => this.get(key)); return pipe },
      set: (key: string, value: unknown, opts?: { ex?: number }) => { ops.push(() => this.set(key, value, opts)); return pipe },
      del: (...keys: string[]) => { ops.push(() => this.del(...keys)); return pipe },
      lpush: (key: string, ...values: unknown[]) => { ops.push(() => this.lpush(key, ...values)); return pipe },
      lrem: (key: string, count: number, value: unknown) => { ops.push(() => this.lrem(key, count, value)); return pipe },
      exec: () => Promise.all(ops.map(op => op())),
    }
    return pipe
  }
}

export const localKV = new LocalKV()
