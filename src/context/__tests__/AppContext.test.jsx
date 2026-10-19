// src/context/__tests__/AppContext.test.jsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppProvider, useAppContext } from '../AppContext';
import { mockSearchVegRecipesData } from '../../__mocks__/mockData';

// Test consumer component to interact with AppContext
const TestConsumer = () => {
  const { favorites, toggleFavorite } = useAppContext();
  const testRecipe = mockSearchVegRecipesData[0];

  return (
    <div>
      <span data-testid="fav-count">{favorites.length}</span>
      <button onClick={() => toggleFavorite(testRecipe)}>
        Toggle Favorite
      </button>
    </div>
  );
};

describe('AppContext Integration / Unit Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial empty favorites state and allows toggling a recipe', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    const count = screen.getByTestId('fav-count');
    const button = screen.getByRole('button', { name: /toggle favorite/i });

    // Initial count should be 0
    expect(count).toHaveTextContent('0');

    // Add to favorites
    fireEvent.click(button);
    expect(count).toHaveTextContent('1');

    // Remove from favorites
    fireEvent.click(button);
    expect(count).toHaveTextContent('0');
  });
});