/**
 * Normalizes input: removes accents, converts to lowercase, and trims excess spacing.
 */
export const sanitizeInput = (raw = '') => {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Structural Guard with configurable maxWords:
 * - Default maxWords = 2 (For Fridge Chips)
 * - Higher maxWords = 6 (For General Search)
 */
export const isValidStructure = (word = '', maxWords = 2) => {
  const clean = word.trim();
  if (clean.length < 2) return false; 
  if (/(.)\1{2,}/.test(clean)) return false; 
  if (/[0-9!@#$%^&*()_+=~`[\]{}|\\:;"'<>,.?/]/.test(clean)) return false;
  
  const wordCount = clean.split(/\s+/).length;
  if (wordCount > maxWords) return false;

  return true;
};