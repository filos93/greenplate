import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeCard } from '../RecipeCard';
import { useAppContext } from '../../context/AppContext';
import { mockSearchVegRecipesData } from '../../__mocks__/mockData';

// Mock the AppContext hook
vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

describe('RecipeCard Component', () => {
  const mockRecipe = mockSearchVegRecipesData[0];
  const mockToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe title, summary, and image correctly', () => {
    useAppContext.mockReturnValue({
      favorites: [],
      toggleFavorite: mockToggleFavorite,
    });

    render(<RecipeCard recipe={mockRecipe} />);

    // 1. Verify Title using flexible regex
    expect(screen.getByText(/Test Spinach Pasta/i)).toBeInTheDocument();

    // 2. Verify Image via alt text and src attribute
    const image = screen.getByAltText(/Test Spinach Pasta/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockRecipe.image);
  });

  it('shows "Save" button state when the recipe is NOT in favorites', () => {
    useAppContext.mockReturnValue({
      favorites: [],
      toggleFavorite: mockToggleFavorite,
    });

    render(<RecipeCard recipe={mockRecipe} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('calls toggleFavorite with correct payload when clicked', () => {
    useAppContext.mockReturnValue({
      favorites: [],
      toggleFavorite: mockToggleFavorite,
    });

    render(<RecipeCard recipe={mockRecipe} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
    expect(mockToggleFavorite).toHaveBeenCalledWith(mockRecipe);
  });
});