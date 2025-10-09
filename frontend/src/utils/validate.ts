export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{8,}$/.test(id);
}

export function isValidMessage(text: string): boolean {
  return typeof text === "string" && text.length > 0 && text.length <= 500;
}
