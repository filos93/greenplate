// src/utils/validators.js

/**
 * Normalizes input identically for VegSearch and MyFridge:
 * - Converts to lowercase
 * - Strips accents/diacritics (e.g., 'sauté' -> 'saute')
 * - Converts hyphens & underscores to spaces
 * - Removes remaining special characters and numbers
 * - Collapses whitespace & trims
 */
export const sanitizeInput = (str = '') => {
  return str
    .toLowerCase()
    .normalize('NFD')                  // Split accented characters into base letters + diacritics
    .replace(/[\u0300-\u036f]/g, '')   // Strip diacritics/accents
    .replace(/[-_]/g, ' ')             // Converts hyphens & underscores into spaces
    .replace(/[^a-z\s]/g, '')          // Removes numbers and special symbols (letters & spaces only)
    .replace(/\s+/g, ' ')             // Collapses multiple spaces into one
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

  // Reject numbers and special symbols across both VegSearch and MyFridge
  if (/[0-9!@#$%^&*()_+=~`[\]{}|\\:;"'<>,.?/]/.test(clean)) return false;
  
  const wordCount = clean.split(/\s+/).length;
  if (wordCount > maxWords) return false;

  return true;
};

/**
 * Structural Guard specifically for general search inputs (up to 6 words)
 */
export const isValidSearchQuery = (query = '') => {
  return isValidStructure(query, 6);
};