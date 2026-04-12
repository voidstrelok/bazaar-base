/**
 * Converts a text string into a URL-friendly slug.
 * Equivalent to the backend SlugHelper.Generate method.
 */
export function slugify(text) {
  return text
    .normalize('NFD')                    // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')     // remove diacritic marks
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')         // remove non-alphanumeric chars
    .replace(/-{2,}/g, '-')             // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');           // trim leading/trailing hyphens
}
