import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Proselab",
  description:
    "Proselab cookie policy. How we use cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="legal-root">
      <div className="legal-inner">
        <Link href="/" className="legal-back-link">
          ← Back to home
        </Link>

        <header className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Cookie Policy</h1>
          <p className="legal-updated">Last updated: February 2025</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a
              website. They help websites remember your preferences, keep you
              signed in, and understand how you use the service.
            </p>
          </section>

          <section>
            <h2>2. Cookies We Use</h2>
            <p>Proselab uses the following types of cookies:</p>
            <ul>
              <li>
                <strong>Essential cookies:</strong> Required for the Service to
                function (e.g., authentication, session management). These cannot
                be disabled.
              </li>
              <li>
                <strong>Functional cookies:</strong> Remember your preferences
                (e.g., theme, language) to improve your experience.
              </li>
              <li>
                <strong>Analytics cookies:</strong> Help us understand how
                visitors use the Service (e.g., pages viewed, features used) so
                we can improve it.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Third-Party Cookies</h2>
            <p>
              Our third-party providers (Supabase, Anthropic, ElevenLabs) may set
              their own cookies when you use the Service. These are governed by
              their respective privacy and cookie policies.
            </p>
          </section>

          <section>
            <h2>4. Managing Cookies</h2>
            <p>
              Most browsers allow you to control cookies through settings. You
              can block or delete cookies, but doing so may affect the
              functionality of the Service (e.g., you may need to sign in again
              on each visit).
            </p>
          </section>

          <section>
            <h2>5. Updates</h2>
            <p>
              We may update this Cookie Policy from time to time. We will post
              the updated policy on this page and update the &quot;Last
              updated&quot; date.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              For questions about our use of cookies, contact us at{" "}
              <a href="mailto:contact@proselab.io">contact@proselab.io</a> or visit our{" "}
              <Link href="/contact">Contact page</Link>.
            </p>
          </section>
        </article>

        <nav className="legal-nav">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
