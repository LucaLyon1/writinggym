import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Proselab",
  description:
    "Proselab terms of service. Rules and guidelines for using our writing practice platform.",
};

export default function TermsPage() {
  return (
    <div className="legal-root">
      <div className="legal-inner">
        <Link href="/" className="legal-back-link">
          ← Back to home
        </Link>

        <header className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-updated">Last updated: February 2025</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Proselab (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree,
              do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              Proselab is a writing practice platform that provides AI-powered
              craft analysis of literary passages, writing exercises with
              constraints, feedback on user submissions, and progress tracking.
              We reserve the right to modify, suspend, or discontinue any part of
              the Service at any time.
            </p>
          </section>

          <section>
            <h2>3. Account and Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activity under your account. You must
              provide accurate information when signing up.
            </p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
              <li>Submit content that infringes intellectual property, is defamatory, or otherwise harmful</li>
              <li>Abuse, overload, or interfere with the Service or its infrastructure</li>
              <li>Scrape, harvest, or collect data from the Service without permission</li>
            </ul>
            <p>
              We may suspend or terminate your account if you violate these
              terms.
            </p>
          </section>

          <section>
            <h2>5. Your Content</h2>
            <p>
              You retain ownership of the writing you submit. By submitting
              content, you grant us a limited license to process, store, and
              display it as necessary to provide the Service (e.g., to generate AI
              feedback, save completions to your profile). We do not claim
              ownership of your creative work.
            </p>
          </section>

          <section>
            <h2>6. AI and Third-Party Content</h2>
            <p>
              The Service uses AI (e.g., Claude) to analyze passages and provide
              feedback. AI outputs are for educational purposes and may not
              always be accurate. Literary passages featured in the Service are
              used for educational and transformative purposes under fair use.
            </p>
          </section>

          <section>
            <h2>7. Subscription and Payment</h2>
            <p>
              Some features may require a paid subscription. Payment terms,
              refunds, and cancellation policies will be disclosed at the time
              of purchase. We may change pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2>8. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
              OR SECURE.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROSELAB AND ITS AFFILIATES
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
              SERVICE.
            </p>
          </section>

          <section>
            <h2>10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of
              material changes by posting the updated terms on this page. Your
              continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:contact@proselab.io">contact@proselab.io</a> or visit our{" "}
              <Link href="/contact">Contact page</Link>.
            </p>
          </section>
        </article>

        <nav className="legal-nav">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
