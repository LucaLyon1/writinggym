/**
 * In-app strip for the Black Friday yearly offer.
 *
 * Rendered only when `isBlackFridayActive()` says so; the caller decides, at
 * render time on the server, so the banner cannot flash on for a client whose
 * clock disagrees with the promo window.
 */
export function BlackFridayBanner() {
  return (
    <div className="plans-banner" role="note">
      <span className="plans-banner-label">Black Friday</span>
      <span>A year of ProseLab for $79, $20 off. Ends Monday 30 November.</span>
      <span>
        Code <code className="plans-banner-code">BLACKFRIDAY26</code> applied at checkout.
      </span>
    </div>
  )
}
