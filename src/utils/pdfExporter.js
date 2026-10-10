import { jsPDF } from 'jspdf';
import { getRecipeInformation } from '../api/spoonacular';

/**
 * Helper to convert an image URL (like /logo.svg) to a Data URL for jsPDF
 */
const getLogoDataUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 100;
      canvas.height = img.height || 100;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null); // Fallback gracefully if logo fails to load
    img.src = url;
  });
};

/**
 * Normalizes recipe instructions into an array of step objects [{ number: 1, step: "..." }]
 */
export function getRecipeSteps(recipe) {
  // 1. Live Spoonacular structure: analyzedInstructions[0].steps
  if (recipe?.analyzedInstructions?.[0]?.steps?.length > 0) {
    return recipe.analyzedInstructions[0].steps;
  }

  // 2. Fallback if steps are stored as an array of strings or objects (Local cache / Mock structure)
  if (Array.isArray(recipe?.instructions) && recipe.instructions.length > 0) {
    return recipe.instructions.map((inst, index) => ({
      number: index + 1,
      step: typeof inst === 'string' ? inst : inst.step || ''
    }));
  }

  // 3. Fallback if instructions are provided as a single text string (with HTML or plain text)
  if (typeof recipe?.instructions === 'string' && recipe.instructions.trim()) {
    const cleanText = recipe.instructions.replace(/<[^>]*>?/gm, '');
    const sentences = cleanText
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);

    return sentences.map((sentence, index) => ({
      number: index + 1,
      step: sentence.endsWith('.') ? sentence : `${sentence}.`
    }));
  }

  // 4. Explicit fallback when no instructions exist
  return [
    { number: 1, step: 'No step-by-step instructions provided for this recipe.' }
  ];
}

/**
 * Standardized single-recipe PDF generator for Search, Fridge, and Favorites
 */
export const downloadRecipePDF = async (recipe) => {
  if (!recipe) return;

  // 🌐 ENRICH RECIPE DATA IF INSTRUCTIONS OR INGREDIENTS ARE MISSING
  let fullRecipe = recipe;
  const hasInstructions =
    recipe?.analyzedInstructions?.[0]?.steps?.length > 0 ||
    (typeof recipe?.instructions === 'string' && recipe.instructions.trim().length > 0);

  if (!hasInstructions && recipe.id) {
    const detailedData = await getRecipeInformation(recipe.id);
    if (detailedData) {
      fullRecipe = { ...recipe, ...detailedData };
    }
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;

  // Load Logo Image
  const logoData = await getLogoDataUrl('/logo.svg');

  // 1. BRAND HEADER BANNER
  doc.setFillColor(16, 185, 129); // Emerald (#10b981)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Render Logo Icon if available
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 4, 20, 20);

    // Brand Text beside logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('GreenPlate', margin + 24, 18);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('GreenPlate', margin, 18);
  }

  // Header Subtitle / Date Stamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  doc.text(`Plant-Based Recipe Card • Generated ${today}`, pageWidth - margin, 18, {
    align: 'right'
  });

  yPos = 38;

  // 2. RECIPE TITLE & SUMMARY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);

  const titleLines = doc.splitTextToSize(fullRecipe.title || 'Recipe Details', contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 8;

  if (fullRecipe.summary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const cleanSummary = fullRecipe.summary.replace(/<[^>]+>/g, '');
    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 4.8 + 6;
  }

  // 3. DIETARY BADGE
  const badgeWidth = 45;
  const badgeHeight = 9;

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, yPos, badgeWidth, badgeHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('100% VEGETARIAN', margin + 5, yPos + 6);

  yPos += badgeHeight + 10;

  // 4. UNIFIED INGREDIENTS SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('INGREDIENTS', margin, yPos);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 2, margin + 30, yPos + 2);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  // Extract ingredients cleanly regardless of API source format
  const ingredients =
    fullRecipe.extendedIngredients ||
    [...(fullRecipe.usedIngredients || []), ...(fullRecipe.missedIngredients || [])];

  if (ingredients.length > 0) {
    ingredients.forEach((ing) => {
      doc.setFillColor(16, 185, 129);
      doc.rect(margin + 1, yPos - 2.5, 2, 2, 'F');

      const name = ing.original || ing.name;
      const splitIng = doc.splitTextToSize(name, contentWidth - 8);
      doc.text(splitIng, margin + 6, yPos);
      yPos += splitIng.length * 5;
    });
  } else {
    doc.text('Standard fresh pantry ingredients.', margin + 6, yPos);
    yPos += 6;
  }

  yPos += 8;

  // 5. INSTRUCTIONS SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('INSTRUCTIONS', margin, yPos);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 2, margin + 32, yPos + 2);
  yPos += 10;

  // Extract steps dynamically from Spoonacular API array, string, or fallback message
  const getSteps = () => {
    // 1. Primary: Spoonacular analyzedInstructions array
    if (fullRecipe.analyzedInstructions?.[0]?.steps?.length > 0) {
      return fullRecipe.analyzedInstructions[0].steps;
    }

    // 2. Secondary: Spoonacular plain/HTML text instructions string
    if (typeof fullRecipe.instructions === 'string' && fullRecipe.instructions.trim()) {
      const cleanText = fullRecipe.instructions.replace(/<[^>]*>?/gm, '');
      const sentences = cleanText
        .split('.')
        .map((s) => s.trim())
        .filter(Boolean);

      return sentences.map((sentence, index) => ({
        number: index + 1,
        step: sentence.endsWith('.') ? sentence : `${sentence}.`
      }));
    }

    // 3. Explicit fallback when no instructions exist
    return [
      { number: 1, step: 'No step-by-step instructions provided for this recipe.' }
    ];
  };

  const steps = getSteps();

  steps.forEach((stepItem) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = 20;
    }

    // Step Number Badge
    const circleRadius = 3.5;
    const circleCenterX = margin + circleRadius;
    const circleCenterY = yPos;

    doc.setFillColor(241, 245, 249);
    doc.circle(circleCenterX, circleCenterY, circleRadius, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text(String(stepItem.number), circleCenterX, circleCenterY, {
      align: 'center',
      baseline: 'middle'
    });

    // Step Description Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const textXPos = margin + 10;
    const splitStep = doc.splitTextToSize(stepItem.step, contentWidth - 12);

    doc.text(splitStep, textXPos, circleCenterY, { baseline: 'middle' });

    const lineHeight = 4.5;
    const blockHeight = Math.max(10, splitStep.length * lineHeight);
    yPos += blockHeight + 3;
  });

  // 6. FOOTER STAMP
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('GreenPlate • Plant-Based Recipe Discovery & Pantry Matcher', margin, pageHeight - 9);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 9, { align: 'right' });

  const cleanFilename = (fullRecipe.title || 'recipe')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  doc.save(`${cleanFilename}_recipe.pdf`);
};


// Unified batch exporter for Favorites (Single Multi-Page PDF Document), max 30 recipes per batch
export const downloadFavoritesBatchPDF = async (favoritesList = []) => {
  if (!Array.isArray(favoritesList) || !favoritesList.length) return;

  // CAP BATCH EXPORT AT 30 RECIPES MAXIMUM
  const MAX_BATCH_LIMIT = 30;
  const safeFavoritesList = favoritesList.slice(0, MAX_BATCH_LIMIT);

  // PRE-FETCH FULL DETAILS FOR ALL RECIPES IN BATCH
  const enrichedFavorites = await Promise.all(
    safeFavoritesList.map(async (recipe) => {
      const hasInstructions =
        recipe?.analyzedInstructions?.[0]?.steps?.length > 0 ||
        (typeof recipe?.instructions === 'string' && recipe.instructions.trim().length > 0);

      if (!hasInstructions && recipe.id) {
        const fullData = await getRecipeInformation(recipe.id);
        return fullData ? { ...recipe, ...fullData } : recipe;
      }
      return recipe;
    })
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Load logo icon once for the entire document
  const logoData = await getLogoDataUrl('/logo.svg');

  enrichedFavorites.forEach((recipe, index) => {
    // Add a new page for every recipe after the first one
    if (index > 0) {
      doc.addPage();
    }

    let yPos = 0;

    // 1. BRAND HEADER BANNER
    doc.setFillColor(16, 185, 129); // Emerald (#10b981)
    doc.rect(0, 0, pageWidth, 28, 'F');

    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, 4, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('GreenPlate Cookbook', margin + 24, 18);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('GreenPlate Cookbook', margin, 18);
    }

    // Header Subtitle / Date Stamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(209, 250, 229);
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.text(`Favorites Collection • ${today}`, pageWidth - margin, 18, {
      align: 'right'
    });

    yPos = 38;

    // 2. RECIPE TITLE & SUMMARY
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);

    const titleLines = doc.splitTextToSize(recipe.title || 'Recipe Details', contentWidth);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8;

    if (recipe.summary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      const cleanSummary = recipe.summary.replace(/<[^>]+>/g, '');
      const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth);
      doc.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 4.8 + 6;
    }

    // 3. DIETARY BADGE
    const badgeWidth = 45;
    const badgeHeight = 9;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, yPos, badgeWidth, badgeHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87);
    doc.text('100% VEGETARIAN', margin + 5, yPos + 6);

    yPos += badgeHeight + 10;

    // 4. INGREDIENTS SECTION
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('INGREDIENTS', margin, yPos);

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 30, yPos + 2);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const ingredients =
      recipe.extendedIngredients ||
      [...(recipe.usedIngredients || []), ...(recipe.missedIngredients || [])];

    if (ingredients.length > 0) {
      ingredients.forEach((ing) => {
        doc.setFillColor(16, 185, 129);
        doc.rect(margin + 1, yPos - 2.5, 2, 2, 'F');

        const name = ing.original || ing.name;
        const splitIng = doc.splitTextToSize(name, contentWidth - 8);
        doc.text(splitIng, margin + 6, yPos);
        yPos += splitIng.length * 5;
      });
    } else {
      doc.text('Standard fresh pantry ingredients.', margin + 6, yPos);
      yPos += 6;
    }

    yPos += 8;

    // 5. INSTRUCTIONS SECTION
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('INSTRUCTIONS', margin, yPos);

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 32, yPos + 2);
    yPos += 10;

    // Helper to extract and normalize steps across all data sources
    const getBatchSteps = () => {
      // 1. Live Spoonacular array structure
      if (recipe.analyzedInstructions?.[0]?.steps?.length > 0) {
        return recipe.analyzedInstructions[0].steps;
      }

      // 2. Array of strings or objects (Local cache / Mock structure)
      if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
        return recipe.instructions.map((s, idx) =>
          typeof s === 'string'
            ? { number: idx + 1, step: s }
            : { number: s.number || idx + 1, step: s.step || '' }
        );
      }

      // 3. Raw text string (plain or HTML from Spoonacular)
      if (typeof recipe.instructions === 'string' && recipe.instructions.trim()) {
        const cleanText = recipe.instructions.replace(/<[^>]*>?/gm, '');
        const sentences = cleanText
          .split('.')
          .map((s) => s.trim())
          .filter(Boolean);

        return sentences.map((sentence, index) => ({
          number: index + 1,
          step: sentence.endsWith('.') ? sentence : `${sentence}.`
        }));
      }

      // 4. Explicit fallback when no instructions exist
      return [
        { number: 1, step: 'No step-by-step instructions provided for this recipe.' }
      ];
    };

    const steps = getBatchSteps();

    steps.forEach((stepItem) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }

      // Step Number Badge
      const circleRadius = 3.5;
      const circleCenterX = margin + circleRadius;
      const circleCenterY = yPos;

      doc.setFillColor(241, 245, 249);
      doc.circle(circleCenterX, circleCenterY, circleRadius, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129);
      doc.text(String(stepItem.number), circleCenterX, circleCenterY, {
        align: 'center',
        baseline: 'middle'
      });

      // Step Description Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const textXPos = margin + 10;
      const splitStep = doc.splitTextToSize(stepItem.step, contentWidth - 12);

      doc.text(splitStep, textXPos, circleCenterY, { baseline: 'middle' });

      const lineHeight = 4.5;
      const blockHeight = Math.max(10, splitStep.length * lineHeight);
      yPos += blockHeight + 3;
    });

    // 6. FOOTER STAMP WITH RECIPE NUMBERING
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('GreenPlate • Saved Favorites Cookbook', margin, pageHeight - 9);
    doc.text(
      `Recipe ${index + 1} of ${enrichedFavorites.length}`,
      pageWidth - margin,
      pageHeight - 9,
      { align: 'right' }
    );
  });

  // Save as a single combined PDF document
  doc.save('greenplate-favorites_cookbook.pdf');
};