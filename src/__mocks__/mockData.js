// src/__mocks__/mockData.js

export const mockSearchVegRecipesData = [
  {
    id: 1,
    title: "Test Spinach Pasta",
    image: "https://spoonacular.com/recipeImages/716429-312x231.jpg",
    summary: "A delicious, creamy spinach pasta dish perfect for testing UI components. Ready in under 30 minutes and fully vegetarian.",
    readyInMinutes: 25,
    servings: 2,
    extendedIngredients: [
      { original: "8 oz pasta" },
      { original: "2 cups fresh baby spinach" },
      { original: "1 tbsp olive oil" },
      { original: "2 cloves garlic, minced" }
    ],
    analyzedInstructions: [
      {
        steps: [
          { step: "Boil water and cook pasta according to package directions." },
          { step: "In a pan, heat olive oil and sauté minced garlic." },
          { step: "Add spinach and cook until wilted." },
          { step: "Toss pasta with the spinach mixture and serve warm." }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Test Tofu Curry",
    image: "https://spoonacular.com/recipeImages/715538-312x231.jpg",
    summary: "A warm and hearty tofu curry with coconut milk, perfect for checking grid layouts and PDF generation.",
    readyInMinutes: 40,
    servings: 4,
    extendedIngredients: [
      { original: "1 block extra firm tofu, cubed" },
      { original: "1 can coconut milk" },
      { original: "2 tbsp curry powder" },
      { original: "1 cup diced carrots" }
    ],
    analyzedInstructions: [
      {
        steps: [
          { step: "Press the tofu to remove excess moisture, then cut into cubes." },
          { step: "Pan-fry tofu cubes until golden brown." },
          { step: "Add carrots, coconut milk, and curry powder to the pan." },
          { step: "Simmer for 15 minutes until vegetables are tender." }
        ]
      }
    ]
  }
];

export const mockFridgeResultsData = [
  {
    id: 716429,
    title: 'Pasta with Garlic, Spinach & Chickpeas',
    image: 'https://spoonacular.com/recipeImages/716429-312x231.jpg',
    summary: 'A fast and easy vegetarian pasta dish packed with protein-rich chickpeas, garlic, and fresh spinach.',
    usedIngredientCount: 3,
    missedIngredientCount: 1,
    usedIngredients: [{ name: 'spinach' }, { name: 'garlic' }, { name: 'chickpeas' }],
    missedIngredients: [{ name: 'pasta' }],
    unusedIngredients: []
  },
  {
    id: 715538,
    title: 'Crispy Tofu & Broccoli Stir Fry',
    image: 'https://spoonacular.com/recipeImages/715538-312x231.jpg',
    summary: 'Golden pan-fried tofu cubes tossed with fresh broccoli florets and savory garlic soy sauce glaze.',
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [{ name: 'tofu' }, { name: 'broccoli' }, { name: 'garlic' }, { name: 'soy sauce' }],
    missedIngredients: [],
    unusedIngredients: []
  },
  {
    id: 640312,
    title: 'Mediterranean Roasted Zucchini & Feta',
    image: 'https://spoonacular.com/recipeImages/640312-312x231.jpg',
    summary: 'Tender roasted zucchini slices topped with crumbled feta cheese, cherry tomatoes, and olive oil.',
    usedIngredientCount: 3,
    missedIngredientCount: 2,
    usedIngredients: [{ name: 'zucchini' }, { name: 'feta' }, { name: 'tomatoes' }],
    missedIngredients: [{ name: 'oregano' }, { name: 'lemon' }],
    unusedIngredients: []
  }
];

export const mockAutocompleteSuggestionsData = [
  { id: 10, title: 'Spinach Pasta' },
  { id: 11, title: 'Spinach Salad' },
  { id: 12, title: 'Spinach Soup' },
  { id: 13, title: 'Tofu Curry' },
  { id: 14, title: 'Vegetable Stir Fry' }
];

export const mockPopularIngredientsData = [
  { id: 1, name: 'Spinach' },
  { id: 2, name: 'Garlic' },
  { id: 3, name: 'Tofu' },
  { id: 4, name: 'Broccoli' },
  { id: 5, name: 'Chickpeas' },
  { id: 6, name: 'Zucchini' }
];