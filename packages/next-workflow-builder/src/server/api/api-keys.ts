import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { resolveUser } from "../auth/resolve-user";
import { db } from "../db";
import { apiKeys } from "../db/schema";

export async function handleGetApiKeys(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, user.id),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: (table, { desc: descFn }) => [descFn(table.createdAt)],
    })

    return NextResponse.json(keys)
  } catch (error) {
    console.error('Failed to list API keys:', error)
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 })
  }
}

export async function handleCreateApiKey(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAnonymous = user.name === 'Anonymous' || user.email?.startsWith('temp-')
    if (isAnonymous) {
      return NextResponse.json(
        { error: 'Anonymous users cannot create API keys' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = body.name || null

    const { randomBytes } = await import('node:crypto')
    const randomPart = randomBytes(24).toString('base64url')
    const key = `wfb_${randomPart}`
    const hash = createHash('sha256').update(key).digest('hex')
    const prefix = key.slice(0, 11)

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
      })

    return NextResponse.json({ ...newKey, key })
  } catch (error) {
    console.error('Failed to create API key:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

export async function handleDeleteApiKey(request: Request, keyId: string): Promise<Response> {
  try {
    const user = await resolveUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id)))
      .returning({ id: apiKeys.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete API key:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
