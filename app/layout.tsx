import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthNav } from "@/components/auth/AuthNav";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import { FirstVisitAuthModal } from "@/components/auth/FirstVisitAuthModal";
import { AuthLinkErrorHandler } from "@/components/auth/AuthLinkErrorHandler";
import { PostTrialPaywall } from "@/components/auth/PostTrialPaywall";
import { CrispChat } from "@/components/CrispChat";
import { FreeUserGate } from "@/components/FreeUserGate";
import { createClient } from "@/lib/supabase/server";
import { isWithinFreeTrial } from "@/lib/trial";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { SidebarProvider } from "@/components/SidebarContext";
import { MobileSidebarToggle } from "@/components/MobileSidebarToggle";
import { SidebarBackdrop } from "@/components/SidebarBackdrop";
import { WhopRegistrationTracker } from "@/components/WhopRegistrationTracker";

// Import Cormorant Garamond font from Google Fonts (local or CDN)
import { Cormorant_Garamond } from "next/font/google";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProseLab",
  description:
    "Train your voice. Study passages with AI craft analysis, write your own version, get feedback, and track your progress.",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
  isFreeUser: boolean
  mustChooseAfterTrial: boolean
}

async function getAuthState(): Promise<AuthState> {
  // Let Next's dynamic-rendering signal from cookies reach the framework.
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isAuthenticated: false, userId: null, userEmail: null, isFreeUser: false, mustChooseAfterTrial: false }

    const withinTrial = isWithinFreeTrial(user.created_at)

    const [{ data: sub, error: subError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('post_trial_choice_at')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    if (subError) {
      console.error('[FreeUserGate] subscriptions query error:', subError)
      return { isAuthenticated: true, userId: user.id, userEmail: user.email ?? null, isFreeUser: !withinTrial, mustChooseAfterTrial: false }
    }

    const isFreeUser = !sub && !withinTrial
    const hasChosen = !!profile?.post_trial_choice_at
    if (profileError) {
      console.error('[PostTrialPaywall] profile query error:', profileError)
    }

    return {
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email ?? null,
      isFreeUser,
      mustChooseAfterTrial: !sub && !withinTrial && !hasChosen,
    }
  } catch (e) {
    console.error('[FreeUserGate] unexpected error:', e)
    return { isAuthenticated: false, userId: null, userEmail: null, isFreeUser: true, mustChooseAfterTrial: false }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userId, userEmail, isFreeUser, mustChooseAfterTrial } = await getAuthState()

  return (
    <html lang="en" translate="no" className={`light notranslate ${GeistMono.variable} ${cormorantGaramond.variable}`}>
      <head>
        <meta name="google" content="notranslate" />
        <Script
          id="cookieyes"
          type="text/javascript"
          src="https://cdn-cookieyes.com/client_data/89f12ea21621052ee39f69acc448847c/script.js"
          strategy="beforeInteractive"
        />
        <Script
          id="whop-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("biz_tGIL6R2J3Z0k5p");whop.track("page");` }} />
      </head>
      <body>
        <WhopRegistrationTracker />
        <AuthModalProvider isAuthenticated={isAuthenticated}>
          <SidebarProvider>
          <header className="auth-header">
            <div className="auth-header-left">
              <MobileSidebarToggle />
              <Link href="/" className="auth-header-logo">
                <span style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
                  Proselab
                </span>
              </Link>
            </div>
            <AuthNav />
          </header>
          <SidebarBackdrop />
          <PostHogIdentify userId={userId} email={userEmail} />
          {!isAuthenticated && <FirstVisitAuthModal />}
          <AuthLinkErrorHandler isAuthenticated={isAuthenticated} />
          <FreeUserGate isFreeUser={isFreeUser} />
          <PostTrialPaywall show={mustChooseAfterTrial} />
          {children}
          {isAuthenticated && <CrispChat />}
          </SidebarProvider>
        </AuthModalProvider>
        <Script
          defer
          data-website-id="51d4b355-7309-41fd-84c5-cd2218b76b82"
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
