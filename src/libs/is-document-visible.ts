export default function isDocumentVisible(): boolean {
  if (typeof document.visibilityState !== 'undefined') {
    return (
      document.visibilityState === 'visible' ||
      document.visibilityState === 'prerender'
    )
  }
  // always assume it's visible
  return true
}
