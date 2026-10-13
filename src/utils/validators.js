/**
 * Normalizes input by: converting to lowercase and trimming whitespace
 */
export const sanitizeInput = (str = '') => {
  return str
    .toLowerCase()
    .replace(/[-_]/g, ' ')   // Converts hyphens & underscores into spaces
    .replace(/[^\w\s]/g, '') // Removes remaining special characters
    .replace(/\s+/g, ' ')   // Collapses multiple spaces into one
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

/**
 * Structural Guard specifically for general search inputs (up to 6 words)
 */
export const isValidSearchQuery = (query = '') => {
  return isValidStructure(query, 6);
};