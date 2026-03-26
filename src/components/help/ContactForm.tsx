import React, { useState, useCallback } from 'react';
import styles from './ContactForm.module.scss';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactFormProps {
  className?: string;
  onSuccess?: () => void;
  defaultSubject?: string;
}

const SUBJECT_OPTIONS = [
  { value: '', label: 'Select a subject', disabled: true },
  { value: 'Catering Inquiry', label: 'Catering & Bulk Orders' },
  { value: 'Subscription Inquiry', label: 'Subscription Inquiry' },
  { value: 'Billing Question', label: 'Billing Question' },
  { value: 'Delivery Issue', label: 'Delivery Issue' },
  { value: 'Technical Problem', label: 'Technical Problem' },
  { value: 'Feedback & Suggestions', label: 'Feedback & Suggestions' },
  { value: 'Other', label: 'Other' },
];

const ContactForm: React.FC<ContactFormProps> = ({ className = "", onSuccess, defaultSubject = '' }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: defaultSubject,
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Validation function
  const validateForm = useCallback((data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    // Subject validation
    if (!data.subject.trim()) {
      newErrors.subject = 'Please select a subject';
    }

    // Message validation
    if (!data.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (data.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Clear submit status when user makes changes
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: '' });
    }
  }, [errors, submitStatus.type]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        // Call success callback
        onSuccess?.();
        
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to send message'
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred. Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSuccess]);

  return (
    <div className={`${styles.contactForm} ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={styles.form}
        role="form"
        aria-label="Contact Form"
        noValidate
      >
        {/* Status Messages */}
        {submitStatus.type && (
          <div 
            className={`${styles.statusMessage} ${styles[submitStatus.type]}`}
            role="alert"
          >
            <i 
              className={`fas ${submitStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}
              aria-hidden="true"
            />
            <span>{submitStatus.message}</span>
          </div>
        )}

        {/* Name Field */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-name" className={styles.label}>
            <i className="fas fa-user" aria-hidden="true"></i>
            Full Name
          </label>
          <input
            type="text"
            id="contact-name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.name ? styles.error : ''}`}
            placeholder="Enter your full name"
            required
            aria-required="true"
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.name && (
            <span id="name-error" className={styles.errorMessage} role="alert">
              {errors.name}
            </span>
          )}
        </div>

        {/* Email Field */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-email" className={styles.label}>
            <i className="fas fa-envelope" aria-hidden="true"></i>
            Email Address
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.email ? styles.error : ''}`}
            placeholder="Enter your email address"
            required
            aria-required="true"
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && (
            <span id="email-error" className={styles.errorMessage} role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Subject Field */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-subject" className={styles.label}>
            <i className="fas fa-tag" aria-hidden="true"></i>
            Subject
          </label>
          <select
            id="contact-subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className={`${styles.select} ${errors.subject ? styles.error : ''}`}
            required
            aria-required="true"
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            disabled={isSubmitting}
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option 
                key={option.value} 
                value={option.value} 
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {errors.subject && (
            <span id="subject-error" className={styles.errorMessage} role="alert">
              {errors.subject}
            </span>
          )}
        </div>

        {/* Message Field */}
        <div className={styles.formGroup}>
          <label htmlFor="contact-message" className={styles.label}>
            <i className="fas fa-comment" aria-hidden="true"></i>
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            className={`${styles.textarea} ${errors.message ? styles.error : ''}`}
            placeholder="Describe your question or issue in detail..."
            rows={5}
            required
            aria-required="true"
            aria-describedby={errors.message ? 'message-error' : undefined}
            disabled={isSubmitting}
          />
          {errors.message && (
            <span id="message-error" className={styles.errorMessage} role="alert">
              {errors.message}
            </span>
          )}
          <div className={styles.characterCount}>
            {formData.message.length}/2000 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
            aria-describedby="submit-help"
          >
            <div className={styles.buttonContent}>
              {isSubmitting ? (
                <>
                  <div className={styles.spinner} aria-hidden="true"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" aria-hidden="true"></i>
                  <span>Send Message</span>
                </>
              )}
            </div>
          </button>
          <p id="submit-help" className={styles.helpText}>
            We typically respond within 24 hours during business days.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;