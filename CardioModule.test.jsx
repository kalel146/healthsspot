import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import CardioModule from './CardioModule';

test('calculates kcal correctly', () => {
  const { getByLabelText, getByText } = render(
    <ThemeProvider>
      <CardioModule />
    </ThemeProvider>
  );

  fireEvent.change(getByLabelText(/METs/i), { target: { value: 10 } });
  fireEvent.change(getByLabelText(/Βάρος/i), { target: { value: 70 } });
  fireEvent.change(getByLabelText(/Διάρκεια/i), { target: { value: 30 } });

  fireEvent.click(getByText(/Υπολόγισε kcal/i));

  expect(getByText(/VO2:/i)).toBeInTheDocument();
  expect(getByText(/kcal:/i)).toBeInTheDocument();
});
