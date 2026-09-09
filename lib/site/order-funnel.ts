/**
 * The order funnel — `/begin` and every route beneath it
 * (`/begin/personalized-book/price`, `/begin/personalized-book/form`,
 * and anything deeper).
 *
 * Once the visitor is inside this flow they are already ordering, so the
 * site-wide gold "Buyurtma bering" ("Order Now") CTA that the Navbar and
 * Footer show on normal public pages is redundant duplicate navigation
 * and is hidden here. Nothing else about the Navbar or Footer changes —
 * the Footer still renders its full informational / navigation / legal /
 * social content.
 *
 * Read through `usePathname()` in the (client) Navbar/Footer. This app
 * has no `next.config` rewrites and no Proxy file, so the prerendered
 * pathname always matches the browser's — the check resolves identically
 * on the server and after hydration, with no mismatch.
 */
export function isOrderFunnelPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/begin" || pathname.startsWith("/begin/");
}
