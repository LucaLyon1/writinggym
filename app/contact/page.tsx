import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Proselab",
  description:
    "Contact Proselab. Get in touch for support, feedback, or business inquiries.",
};

export default function ContactPage() {
  return (
    <div className="legal-root">
      <div className="legal-inner">
        <Link href="/" className="legal-back-link">
          ← Back to home
        </Link>

        <header className="legal-header">
          <p className="legal-eyebrow">Get in touch</p>
          <h1 className="legal-title">Contact</h1>
          <p className="legal-subtitle">
            Have a question, feedback, or need support? We&apos;d love to hear from you.
          </p>
        </header>

        <article className="legal-content contact-content">
          <section className="contact-section">
            <h2>Email</h2>
            <p>
              For general inquiries, support, or feedback:
            </p>
            <a href="mailto:contact@proselab.io" className="contact-link">
              contact@proselab.io
            </a>
          </section>

          <section className="contact-section">
            <h2>Social</h2>
            <p>Follow us and stay updated:</p>
            <ul className="contact-links">
              <li>
                <a
                  href="https://x.com/LucaSav_io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X (Twitter) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://substack.com/@lucasavio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Substack ↗
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/LucaLyon1/writinggym"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </section>

          <section className="contact-section">
            <h2>Response Time</h2>
            <p>
              We aim to respond to emails within a few business days. For urgent
              account or billing issues, please include &quot;Urgent&quot; in
              your subject line.
            </p>
          </section>
        </article>

        <nav className="legal-nav">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookies">Cookie Policy</Link>
        </nav>
      </div>
    </div>
  );
}
