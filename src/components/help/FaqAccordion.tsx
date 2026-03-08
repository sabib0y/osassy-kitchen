import React, { useState, useMemo } from 'react';
import styles from './FaqAccordion.module.scss';

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
  selectedCategory?: string;
  searchQuery?: string;
  className?: string;
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({
  faqs,
  selectedCategory = "All",
  searchQuery = "",
  className = ""
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    if (!faqs || faqs.length === 0) return [];

    const validFaqs = faqs.filter((faq) => {
      // Validate FAQ structure
      return faq && faq.id && faq.question && faq.answer && faq.category;
    });

    if (validFaqs.length === 0) return [];

    return validFaqs.filter((faq) => {
      // Category filter
      const categoryMatch = selectedCategory === "All" || faq.category === selectedCategory;
      
      // Search filter (case-insensitive, searches both question and answer)
      const searchMatch = !searchQuery || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  // Check if we have any valid FAQs at all
  const hasValidFaqs = faqs && faqs.some((faq) => 
    faq && faq.id && faq.question && faq.answer && faq.category
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded(id);
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'Subscription': 'primary',
      'Billing': 'accent',
      'Delivery': 'secondary',
      'Food': 'success',
      'Technical': 'info',
      'Other': 'default'
    };
    return colorMap[category] || 'default';
  };

  // Empty states
  if (!faqs || faqs.length === 0 || !hasValidFaqs) {
    return (
      <div className={`${styles.emptyState} ${className}`}>
        <div className={styles.emptyIcon}>
          <i className="fas fa-question-circle" aria-hidden="true"></i>
        </div>
        <h3>No FAQs available</h3>
        <p>We&rsquo;re working on adding helpful frequently asked questions.</p>
      </div>
    );
  }

  if (filteredFaqs.length === 0) {
    if (searchQuery) {
      return (
        <div className={`${styles.emptyState} ${className}`}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-search" aria-hidden="true"></i>
          </div>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or browse by category.</p>
        </div>
      );
    }

    if (selectedCategory !== "All") {
      return (
        <div className={`${styles.emptyState} ${className}`}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-folder-open" aria-hidden="true"></i>
          </div>
          <h3>No FAQs in this category</h3>
          <p>Try selecting a different category or browse all FAQs.</p>
        </div>
      );
    }
  }

  return (
    <div className={`${styles.faqAccordion} ${className}`}>
      {filteredFaqs.map((faq) => {
        const isExpanded = expandedItems.has(faq.id);
        const categoryColor = getCategoryColor(faq.category);

        return (
          <div
            key={faq.id}
            className={`${styles.faqItem} ${isExpanded ? styles.expanded : ''}`}
            data-testid="faq-item"
          >
            <button
              className={styles.faqHeader}
              onClick={() => toggleExpanded(faq.id)}
              onKeyDown={(e) => handleKeyDown(e, faq.id)}
              aria-expanded={isExpanded}
              aria-controls={`faq-answer-${faq.id}`}
              aria-label={`Expand FAQ: ${faq.question}`}
              type="button"
            >
              <div className={styles.faqQuestion}>
                <div className={styles.questionContent}>
                  <span className={`${styles.categoryBadge} ${styles[categoryColor]}`} aria-hidden="true">
                    {faq.category}
                  </span>
                  <h3 className={styles.questionText}>{faq.question}</h3>
                </div>
              </div>
              <div 
                className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}
                data-testid="expand-icon"
                aria-hidden="true"
              >
                <i className="fas fa-chevron-down"></i>
              </div>
            </button>
            
            <div
              id={`faq-answer-${faq.id}`}
              className={`${styles.faqAnswer} ${isExpanded ? styles.expanded : ''}`}
              data-testid="faq-answer"
              aria-hidden={!isExpanded}
            >
              <div className={`${styles.answerContent} ${isExpanded ? styles.expanded : ''}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;