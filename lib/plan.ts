/**
 * lib/plan.ts
 *
 * Server-side plan enforcement helpers.
 * Always import from this file in API routes — never inline Supabase queries.
 * Uses the service role client so RLS is bypassed (writes are safe).
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

export type PlanId = 'free' | 'core' | 'premium'

export interface Plan {
    id: PlanId
    label: string
    price_monthly_cents: number
    weekly_analysis_limit: number | null
    extract_access: 'restricted' | 'core' | 'full'
    has_playground: boolean
    has_custom_voice: boolean
}

export interface AnalysisQuota {
    allowed: boolean
    used: number
    limit: number | null
}

export interface Entitlements {
    plan_id: PlanId
    plan_label: string
    weekly_analysis_limit: number | null
    analyses_used_this_week: number
    extract_access: 'restricted' | 'core' | 'full'
    has_playground: boolean
    has_custom_voice: boolean
}

// ── Get a user's current plan ────────────────────────────────

export async function getUserPlan(userId: string): Promise<PlanId> {
    const { data } = await supabaseAdmin.rpc('get_user_plan', { p_user_id: userId })
    return (data as PlanId) ?? 'free'
}

// ── Check if user can request an analysis this week ──────────

export async function checkAnalysisQuota(userId: string): Promise<AnalysisQuota> {
    const { data, error } = await supabaseAdmin.rpc('can_request_analysis', {
        p_user_id: userId,
    })
    if (error) throw new Error(error.message)
    const raw = data as Record<string, unknown>
    return {
        allowed: !!raw.allowed,
        used: typeof raw.used === 'number' ? raw.used : 0,
        limit: typeof raw.limit === 'number' ? raw.limit : null,
    }
}

// ── Record that an analysis was served ───────────────────────

export async function recordAnalysisRequest(
    userId: string,
    passageId: string,
    constraintKey: string
): Promise<void> {
    await supabaseAdmin.rpc('record_analysis_request', {
        p_user_id: userId,
        p_passage_id: passageId,
        p_constraint_key: constraintKey,
    })
}

// ── Record a completed writing session ───────────────────────

export async function recordSessionCompletion(
    userId: string,
    passageId: string,
    wordCount?: number
): Promise<void> {
    const { error } = await supabaseAdmin.rpc('record_session_completion', {
        p_user_id: userId,
        p_passage_id: passageId,
        p_word_count: wordCount,
    })
    if (error) throw new Error(error.message)
}

// ── Check if user can access a category ─────────────────────

export async function canAccessCategory(
    userId: string,
    categoryId: string
): Promise<boolean> {
    const { data } = await supabaseAdmin.rpc('can_access_category', {
        p_user_id: userId,
        p_category_id: categoryId,
    })
    return !!data
}

// ── Full plan object (for UI / API responses) ────────────────

export async function getUserPlanDetails(userId: string): Promise<Plan> {
    const planId = await getUserPlan(userId)
    const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()
    if (error) throw new Error(error.message)
    return data as Plan
}

// ── Full entitlements (plan + current usage) ─────────────────

export async function getUserEntitlements(userId: string): Promise<Entitlements> {
    // Try the RPC first; fall back to direct queries if it fails (e.g. stale SQL)
    const { data, error } = await supabaseAdmin.rpc('get_user_entitlements', {
        p_user_id: userId,
    })

    if (!error && data && typeof data === 'object') {
        const e = data as Record<string, unknown>
        return {
            plan_id: (typeof e.plan_id === 'string' ? e.plan_id : 'free') as PlanId,
            plan_label: typeof e.plan_label === 'string' ? e.plan_label : 'Free',
            weekly_analysis_limit: typeof e.weekly_analysis_limit === 'number' ? e.weekly_analysis_limit : null,
            analyses_used_this_week: typeof e.analyses_used_this_week === 'number' ? e.analyses_used_this_week : 0,
            extract_access: (typeof e.extract_access === 'string' ? e.extract_access : 'restricted') as Entitlements['extract_access'],
            has_playground: typeof e.has_playground === 'boolean' ? e.has_playground : false,
            has_custom_voice: typeof e.has_custom_voice === 'boolean' ? e.has_custom_voice : false,
        }
    }

    // ── Fallback: query tables directly ──────────────────────────
    const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

    const planId = (sub?.plan_id ?? 'free') as PlanId

    const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('label, weekly_analysis_limit, extract_access, has_playground, has_custom_voice')
        .eq('id', planId)
        .single()

    const weekStart = new Date()
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const { count } = await supabaseAdmin
        .from('analysis_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('requested_at', weekStart.toISOString())

    return {
        plan_id: planId,
        plan_label: plan?.label ?? 'Free',
        weekly_analysis_limit: plan?.weekly_analysis_limit !== undefined ? plan.weekly_analysis_limit : 5,
        analyses_used_this_week: count ?? 0,
        extract_access: (plan?.extract_access ?? 'restricted') as Entitlements['extract_access'],
        has_playground: plan?.has_playground ?? false,
        has_custom_voice: plan?.has_custom_voice ?? false,
    }
}