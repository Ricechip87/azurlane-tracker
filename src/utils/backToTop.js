export const BACK_TO_TOP_SCROLL_THRESHOLD = 400

export function shouldShowBackToTop({
  scrollY,
  viewportHeight,
  documentHeight,
  threshold = BACK_TO_TOP_SCROLL_THRESHOLD,
}) {
  return documentHeight > viewportHeight && scrollY >= threshold
}
