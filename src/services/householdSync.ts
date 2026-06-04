import { supabase } from '../lib/supabase'

const PENDING_INVITE_KEY = 'pawly-pending-invite'

export type HouseholdRole = 'owner' | 'member'

export type HouseholdInfo = {
  householdId: string
  role: HouseholdRole
  ownerId: string
  memberCount: number
  hasPartner: boolean
  activeInvite?: {
    token: string
    expiresAt: string
    link: string
  }
}

function formatSupabaseError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Unknown error'
  const e = err as { message?: string; code?: string; details?: string; hint?: string }
  const msg = e.message ?? 'Request failed'

  if (msg.includes('does not exist') || e.code === '42P01') {
    return 'Household tables are missing. Run supabase/household.sql in Supabase SQL Editor, then try again.'
  }
  if (msg.includes('create_household_invite') || e.code === 'PGRST202') {
    return 'Invite function missing. Re-run supabase/household.sql in Supabase SQL Editor (full file).'
  }
  if (e.code === '42501' || msg.toLowerCase().includes('permission denied')) {
    return 'Permission denied. Re-run supabase/household.sql to fix database policies.'
  }

  return e.details ? `${msg} (${e.details})` : msg
}

export function captureInviteFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const invite = params.get('invite')?.trim()
  if (!invite) return
  sessionStorage.setItem(PENDING_INVITE_KEY, invite)
  params.delete('invite')
  const next = params.toString()
  const path = window.location.pathname
  window.history.replaceState({}, '', next ? `${path}?${next}` : path)
}

export function getPendingInviteToken(): string | null {
  return sessionStorage.getItem(PENDING_INVITE_KEY)
}

export function clearPendingInviteToken(): void {
  sessionStorage.removeItem(PENDING_INVITE_KEY)
}

export function buildInviteLink(token: string): string {
  const base = window.location.origin.replace(/\/$/, '')
  return `${base}/?invite=${token}`
}

function randomInviteToken(): string {
  const part = () => crypto.randomUUID().replace(/-/g, '')
  return (part() + part()).slice(0, 32)
}

export async function ensureUserHousehold(userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: existing, error: readErr } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (readErr) throw new Error(formatSupabaseError(readErr))
  if (existing?.household_id) return existing.household_id

  const { data: household, error: createErr } = await supabase
    .from('households')
    .insert({ owner_id: userId })
    .select('id')
    .single()

  if (createErr) throw new Error(formatSupabaseError(createErr))

  const { error: memberErr } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
  })
  if (memberErr) throw new Error(formatSupabaseError(memberErr))

  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    pet_name: 'Woody',
    household_id: household.id,
  })
  if (profileErr) throw new Error(formatSupabaseError(profileErr))

  return household.id
}

export async function resolveDataOwnerId(userId: string): Promise<string> {
  if (!supabase) return userId

  const { data: membership, error } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !membership) return userId

  const { data: household, error: houseErr } = await supabase
    .from('households')
    .select('owner_id')
    .eq('id', membership.household_id)
    .maybeSingle()

  if (houseErr || !household) return userId
  return household.owner_id
}

export async function acceptHouseholdInvite(_userId: string, token: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.rpc('accept_household_invite', {
    invite_token: token,
  })

  if (error) throw new Error(formatSupabaseError(error))
  const ownerId = (data as { owner_id?: string })?.owner_id
  if (!ownerId) throw new Error('Could not join shared account')
  return ownerId
}

export async function createHouseholdInvite(_userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.rpc('create_household_invite')

  if (!error && typeof data === 'string' && data.length > 0) {
    return data
  }

  if (error?.code === 'PGRST202') {
    return createHouseholdInviteFallback(_userId)
  }

  if (error) throw new Error(formatSupabaseError(error))
  throw new Error('Could not create invite link')
}

async function createHouseholdInviteFallback(userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const householdId = await ensureUserHousehold(userId)

  const { data: existing, error: readErr } = await supabase
    .from('household_invites')
    .select('token, expires_at')
    .eq('household_id', householdId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (readErr) throw new Error(formatSupabaseError(readErr))
  if (existing?.token) return existing.token

  const token = randomInviteToken()
  const { data, error } = await supabase
    .from('household_invites')
    .insert({
      household_id: householdId,
      created_by: userId,
      token,
    })
    .select('token')
    .single()

  if (error) throw new Error(formatSupabaseError(error))
  return data.token as string
}

export async function fetchHouseholdInfo(userId: string): Promise<HouseholdInfo | null> {
  if (!supabase) return null

  const { data: membership, error } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(formatSupabaseError(error))
  if (!membership) return null

  const { data: household, error: houseErr } = await supabase
    .from('households')
    .select('owner_id')
    .eq('id', membership.household_id)
    .single()

  if (houseErr || !household) return null

  const { count, error: countErr } = await supabase
    .from('household_members')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', membership.household_id)

  if (countErr) throw new Error(formatSupabaseError(countErr))

  const { data: invite } = await supabase
    .from('household_invites')
    .select('token, expires_at')
    .eq('household_id', membership.household_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const memberCount = count ?? 1

  return {
    householdId: membership.household_id,
    role: membership.role as HouseholdRole,
    ownerId: household.owner_id,
    memberCount,
    hasPartner: memberCount > 1,
    activeInvite: invite?.token
      ? {
          token: invite.token,
          expiresAt: invite.expires_at,
          link: buildInviteLink(invite.token),
        }
      : undefined,
  }
}

export async function validateInviteToken(token: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase
    .from('household_invites')
    .select('id')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return !error && Boolean(data)
}
