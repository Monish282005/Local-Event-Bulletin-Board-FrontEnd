/**
 * Validation Utility Helpers for Form Fields
 */

/**
 * Validates international & national phone numbers (10 to 15 digits).
 * Allows optional leading '+', spaces, hyphens, and parentheses.
 * e.g., +91 9876543210, 9876543210, +1 (555) 123-4567
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Ensure basic format matches phone characters
  const phoneCharRegex = /^\+?[0-9\s\-()]{10,20}$/;
  if (!phoneCharRegex.test(trimmed)) return false;
  // Extract strictly numbers and verify digit length between 10 and 15
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Validates standard email addresses.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates names (minimum 2 characters).
 */
export function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}

/**
 * Validates password strength (minimum 8 characters).
 */
export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}
