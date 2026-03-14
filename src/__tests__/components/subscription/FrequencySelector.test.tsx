/**
 * Tests for FrequencySelector component
 * Dropdown for selecting subscription frequency
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FrequencySelector from '@/components/subscription/FrequencySelector';
import { SubscriptionFrequency } from '@/types/user';

describe('FrequencySelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a select dropdown', () => {
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should display all frequency options', () => {
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    expect(screen.getByRole('option', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /bi-weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /monthly/i })).toBeInTheDocument();
  });

  it('should display the current value', () => {
    render(<FrequencySelector value="biweekly" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('biweekly');
  });

  it('should call onChange when a new frequency is selected', async () => {
    const user = userEvent.setup();
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'monthly');

    expect(mockOnChange).toHaveBeenCalledWith('monthly');
  });

  it('should handle all frequency values correctly', async () => {
    const user = userEvent.setup();
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');

    await user.selectOptions(select, 'biweekly');
    expect(mockOnChange).toHaveBeenCalledWith('biweekly');

    await user.selectOptions(select, 'monthly');
    expect(mockOnChange).toHaveBeenCalledWith('monthly');

    await user.selectOptions(select, 'weekly');
    expect(mockOnChange).toHaveBeenCalledWith('weekly');
  });

  it('should have accessible label', () => {
    render(
      <FrequencySelector
        value="weekly"
        onChange={mockOnChange}
        label="Delivery Frequency"
      />
    );

    expect(screen.getByLabelText(/delivery frequency/i)).toBeInTheDocument();
  });

  it('should use default label when none provided', () => {
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    const container = screen.getByTestId('frequency-selector');
    expect(container.className).toContain('frequencySelector');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<FrequencySelector value="weekly" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');

    // Focus the select
    await user.tab();
    expect(select).toHaveFocus();
  });
});
