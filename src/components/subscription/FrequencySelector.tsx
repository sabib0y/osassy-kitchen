/**
 * FrequencySelector component
 * Dropdown for selecting subscription delivery frequency
 */

import React from 'react';
import { SubscriptionFrequency } from '@/types/user';
import styles from '@/styles/components/subscription/frequencySelector.module.scss';

interface FrequencySelectorProps {
  value: SubscriptionFrequency;
  onChange: (frequency: SubscriptionFrequency) => void;
  label?: string;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  value,
  onChange,
  label = 'Frequency',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as SubscriptionFrequency);
  };

  return (
    <div className={styles.frequencySelector} data-testid="frequency-selector">
      <label htmlFor="frequency-select" className={styles.label}>
        {label}
      </label>
      <select
        id="frequency-select"
        className={styles.select}
        value={value}
        onChange={handleChange}
      >
        <option value="weekly">Weekly</option>
        <option value="biweekly">Bi-weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
  );
};

export default FrequencySelector;
