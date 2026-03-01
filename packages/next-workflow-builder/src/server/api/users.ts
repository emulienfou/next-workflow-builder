import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { resolveUser } from "../auth/resolve-user";
import { db } from "../db";
import { accounts, users } from "../db/schema";

export async function handleGetUser(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAnonymous: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
      columns: { providerId: true },
    })

    return NextResponse.json({
      ...userData,
      providerId: userAccount?.providerId ?? null,
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get user' },
      { status: 500 }
    )
  }
}

export async function handleUpdateUser(request: Request): Promise<Response> {
  try {
    const user = await resolveUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
      columns: { providerId: true },
    })

    const oauthProviders = ['vercel', 'github', 'google']
    if (userAccount && oauthProviders.includes(userAccount.providerId)) {
      return NextResponse.json(
        { error: 'Cannot update profile for OAuth users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updates: { name?: string; email?: string } = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email

    await db.update(users).set(updates).where(eq(users.id, user.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}
