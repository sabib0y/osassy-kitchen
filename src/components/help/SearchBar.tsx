import React, { useState, useCallback, useEffect } from 'react';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search for answers...",
  initialValue = "",
  debounceMs = 300,
  className = ""
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isTyping, setIsTyping] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (query === initialValue) return; // Skip initial value

    setIsTyping(true);
    const timer = setTimeout(() => {
      onSearch(query);
      setIsTyping(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsTyping(false);
    };
  }, [query, onSearch, debounceMs, initialValue]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`${styles.searchBar} ${className}`} role="search">
      <div className={styles.inputWrapper}>
        <div className={styles.searchIcon}>
          <i className="fas fa-search" aria-hidden="true"></i>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${styles.searchInput} ${isTyping ? styles.typing : ''}`}
          aria-label="Search FAQs"
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
            title="Clear search"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        )}
        {isTyping && (
          <div className={styles.loadingIndicator} aria-hidden="true">
            <i className="fas fa-circle-notch fa-spin"></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;