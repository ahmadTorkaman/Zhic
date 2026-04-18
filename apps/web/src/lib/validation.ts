const IRAN_MOBILE_RE = /^(?:\+98|0)9\d{9}$/;

export function validateIranianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\u200C]/g, '');
  return IRAN_MOBILE_RE.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\u200C]/g, '');
  if (cleaned.startsWith('+98')) return `0${cleaned.slice(3)}`;
  return cleaned;
}
