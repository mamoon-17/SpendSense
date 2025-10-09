export function sanitizeText(text: string, maxLength = 500): string {
  let sanitized = text.replace(/[<>]/g, ""); // Remove angle brackets
  sanitized = sanitized.replace(/\s+/g, " ").trim(); // Collapse whitespace
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}
