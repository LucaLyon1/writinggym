import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements } from '@/lib/plan'
import { ManageSubscriptionButton } from '@/components/checkout/ManageSubscriptionButton'
import { ProfileUsernameForm } from '@/components/profile/ProfileUsernameForm'
import { logout } from '@/app/actions/auth'
import { SidebarNav } from '@/components/AppSidebar'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/signup?next=/profile/settings')
  }

  const [entitlements, profileResult] = await Promise.all([
    getUserEntitlements(user.id),
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single(),
  ])

  const { data: profile } = profileResult
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const hasPaidPlan = entitlements.plan_id !== 'free'

  return (
    <div className="analysis-view">
    <div className="ea-root">
    <div className="ea-page-layout">
      <ProfileSidebar>
        <span className="sidebar-label">Account</span>
        <Link href="/profile" className="cat-btn">
          <span className="cat-btn-label">Profile</span>
        </Link>
        <Link href="/profile/settings" className="cat-btn active">
          <span className="cat-btn-label">Settings</span>
        </Link>
        <form action={logout}>
          <button type="submit" className="cat-btn">
            <span className="cat-btn-label">Sign out</span>
          </button>
        </form>
        <SidebarNav />
      </ProfileSidebar>

      <main className="ea-center-col">
        <section className="ea-stage">
          <header className="ea-stage-head">
            <h2 className="ea-stage-title">Settings</h2>
          </header>
          <div className="ea-stage-body profile-stage-body settings-body">
            <div className="settings-sections">

              <div className="settings-section">
                <h3 className="settings-section-heading">Profile picture</h3>
                <div className="settings-avatar-row">
                  <div className="settings-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="settings-avatar-img" referrerPolicy="no-referrer" />
                    ) : (
                      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="40" cy="30" r="14" fill="currentColor" opacity="0.25" />
                        <ellipse cx="40" cy="62" rx="22" ry="14" fill="currentColor" opacity="0.18" />
                      </svg>
                    )}
                  </div>
                  <div className="settings-avatar-info">
                    <p className="settings-avatar-hint">
                      {avatarUrl
                        ? 'Your profile picture is synced from your Google account.'
                        : 'Sign in with Google to use your Google profile picture.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-heading">Username</h3>
                <div className="settings-field-body">
                  <ProfileUsernameForm initialUsername={profile?.username ?? ''} />
                </div>
              </div>


            </div>
          </div>
        </section>
      </main>

      <aside className="ea-right-col">
        <div className="ea-right-card">
          <h3 className="ea-right-card-heading">Email</h3>
          <p className="settings-email-display">{user.email}</p>
        </div>

        <div className="ea-right-card">
          <h3 className="ea-right-card-heading">Billing</h3>
          <div className="settings-billing-actions">
            {hasPaidPlan ? (
              <ManageSubscriptionButton className="settings-save-btn">
                Manage billing
              </ManageSubscriptionButton>
            ) : (
              <Link href="/pricing" className="settings-save-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                View plans
              </Link>
            )}
          </div>
        </div>
      </aside>
    </div>
    </div>
    </div>
  )
}
