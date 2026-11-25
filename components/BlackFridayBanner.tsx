interface Props {
  /**
   * `page` renders full-bleed as the first child of .plans-root, directly under
   * the app header. `modal` (default) stays inset for the free-user gate.
   */
  variant?: 'page' | 'modal'
}

/**
 * In-app strip for the Black Friday yearly offer.
 *
 * Rendered only when `isBlackFridayActive()` says so; the caller decides, at
 * render time on the server, so the banner cannot flash on for a client whose
 * clock disagrees with the promo window.
 */
export function BlackFridayBanner({ variant = 'modal' }: Props) {
  return (
    <div
      className={`plans-banner${variant === 'page' ? ' plans-banner-page' : ''}`}
      role="note"
      aria-label="Black Friday offer"
    >
      <span className="plans-banner-label">Black Friday</span>
      <span>A year of ProseLab for $79, $20 off. Ends Monday 30 November.</span>
      <span>
        Code <code className="plans-banner-code">BLACKFRIDAY26</code> applied at checkout.
      </span>
    </div>
  )
}
