import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Proselab",
  description:
    "Proselab privacy policy. How we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-root">
      <div className="legal-inner">
        <Link href="/" className="legal-back-link">
          ← Back to home
        </Link>

        <header className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-updated">Last updated: February 2025</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Proselab (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the Proselab website and writing practice platform. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our services.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li>
                <strong>Account information:</strong> Email address, display
                name, and authentication credentials when you sign up.
              </li>
              <li>
                <strong>Usage data:</strong> Passages you study, completions
                you submit, feedback you receive, and activity patterns (e.g.,
                heatmap data).
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type,
                device information, and cookies (see our{" "}
                <Link href="/cookies">Cookie Policy</Link>).
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Store and display your saved completions and progress</li>
              <li>Send service-related communications (e.g., email verification)</li>
              <li>Analyze usage to improve the product</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. Third-Party Services</h2>
            <p>
              We use third-party services that may process your data:
            </p>
            <ul>
              <li>
                <strong>Supabase:</strong> Authentication and database hosting
              </li>
              <li>
                <strong>Anthropic (Claude):</strong> AI analysis and feedback
              </li>
              <li>
                <strong>ElevenLabs:</strong> Text-to-speech for reading aloud
              </li>
            </ul>
            <p>
              Each provider has its own privacy policy. We recommend reviewing
              them for details on how they handle your data.
            </p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain your account data and saved completions for as long as
              your account is active. You may request deletion of your account
              and associated data at any time by contacting us at{" "}
              <a href="mailto:contact@proselab.io">contact@proselab.io</a>.
            </p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access,
              correct, delete, or port your personal data. You may also have the
              right to object to or restrict certain processing. To exercise
              these rights, contact us at{" "}
              <a href="mailto:contact@proselab.io">contact@proselab.io</a>.
            </p>
          </section>

          <section>
            <h2>7. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2>8. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              For questions about this Privacy Policy or our data practices,
              contact us at{" "}
              <a href="mailto:contact@proselab.io">contact@proselab.io</a> or visit our{" "}
              <Link href="/contact">Contact page</Link>.
            </p>
          </section>
        </article>

        <nav className="legal-nav">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
