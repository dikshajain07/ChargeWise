/* Reads a theme token ("34 228 255") from :root and returns an rgba() string
   usable by SVG, Leaflet and Recharts. */
export function readColor(name: string, alpha = 1): string {
  if (typeof window === 'undefined') return `rgba(34, 228, 255, ${alpha})`;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return `rgba(34, 228, 255, ${alpha})`;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}