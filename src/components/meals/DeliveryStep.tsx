import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Phone, Calendar, MessageSquare, Clock } from 'lucide-react';
import { DeliveryDetails, DELIVERY_DAYS, WEEKDAY_TIME_SLOTS, SATURDAY_TIME_SLOTS } from '../../types/meal-plans';
import styles from '../../styles/components/meals/deliveryStep.module.scss';

interface DeliveryStepProps {
  onContinue: (deliveryDetails: DeliveryDetails) => void;
  onBack: () => void;
  initialData?: DeliveryDetails;
}

interface ValidationErrors {
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  preferredDay?: string;
  preferredTimeSlot?: string;
}

const DeliveryStep: React.FC<DeliveryStepProps> = ({
  onContinue,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState<DeliveryDetails>(
    initialData || {
      address: '',
      city: '',
      postcode: '',
      phone: '',
      instructions: '',
      preferredDay: '',
      preferredTimeSlot: '',
    }
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Determine available time slots based on selected day
  const availableTimeSlots = useMemo(() => {
    if (!formData.preferredDay) return [];
    return formData.preferredDay === 'Saturday' ? SATURDAY_TIME_SLOTS : WEEKDAY_TIME_SLOTS;
  }, [formData.preferredDay]);

  const validatePostcode = (postcode: string): boolean => {
    // UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  };

  const validatePhone = (phone: string): boolean => {
    // UK phone number validation (landline and mobile)
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$|^(\+44\s?[1-9]\d{2,4}|\(?0[1-9]\d{2,4}\)?)\s?\d{3,4}\s?\d{3,4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!validatePostcode(formData.postcode)) {
      newErrors.postcode = 'Please enter a valid UK postcode';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid UK phone number';
    }

    if (!formData.preferredDay) {
      newErrors.preferredDay = 'Please select a preferred delivery day';
    }

    if (!formData.preferredTimeSlot) {
      newErrors.preferredTimeSlot = 'Please select a preferred delivery time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof DeliveryDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being edited
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field as keyof ValidationErrors];
        return updated;
      });
    }

    // Reset time slot when day changes
    if (field === 'preferredDay' && formData.preferredTimeSlot) {
      setFormData((prev) => ({
        ...prev,
        preferredTimeSlot: '',
      }));
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.preferredTimeSlot;
        return updated;
      });
    }
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue(formData);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Delivery Details</h2>
        <p className={styles.subtitle}>Where should we deliver your delicious meals?</p>
      </div>

      <div className={styles.form}>
        {/* Address */}
        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>
            <MapPin size={16} className={styles.labelIcon} />
            Street Address <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="address"
            className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="123 High Street"
            autoComplete="street-address"
          />
          {errors.address && (
            <span className={styles.errorMessage}>{errors.address}</span>
          )}
        </div>

        {/* City and Postcode Row */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city" className={styles.label}>
              City <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="city"
              className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="London"
              autoComplete="address-level2"
            />
            {errors.city && (
              <span className={styles.errorMessage}>{errors.city}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="postcode" className={styles.label}>
              Postcode <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="postcode"
              className={`${styles.input} ${errors.postcode ? styles.inputError : ''}`}
              value={formData.postcode}
              onChange={(e) => handleFieldChange('postcode', e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              autoComplete="postal-code"
            />
            {errors.postcode && (
              <span className={styles.errorMessage}>{errors.postcode}</span>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            <Phone size={16} className={styles.labelIcon} />
            Phone Number <span className={styles.required}>*</span>
          </label>
          <input
            type="tel"
            id="phone"
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="07700 900000"
            autoComplete="tel"
          />
          {errors.phone && (
            <span className={styles.errorMessage}>{errors.phone}</span>
          )}
          <span className={styles.helperText}>
            We'll text you delivery updates
          </span>
        </div>

        {/* Preferred Delivery Day */}
        <div className={styles.formGroup}>
          <label htmlFor="preferredDay" className={styles.label}>
            <Calendar size={16} className={styles.labelIcon} />
            Preferred Delivery Day <span className={styles.required}>*</span>
          </label>
          <select
            id="preferredDay"
            className={`${styles.select} ${errors.preferredDay ? styles.inputError : ''}`}
            value={formData.preferredDay}
            onChange={(e) => handleFieldChange('preferredDay', e.target.value)}
          >
            <option value="">Select a day</option>
            {DELIVERY_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.preferredDay && (
            <span className={styles.errorMessage}>{errors.preferredDay}</span>
          )}
        </div>

        {/* Preferred Time Slot - Only show when day is selected */}
        {formData.preferredDay && (
          <div className={styles.formGroup}>
            <label htmlFor="preferredTimeSlot" className={styles.label}>
              <Clock size={16} className={styles.labelIcon} />
              Preferred Delivery Time <span className={styles.required}>*</span>
            </label>
            <div className={styles.timeSlotGrid}>
              {availableTimeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`${styles.timeSlotButton} ${
                    formData.preferredTimeSlot === slot ? styles.timeSlotButtonActive : ''
                  }`}
                  onClick={() => handleFieldChange('preferredTimeSlot', slot)}
                >
                  <Clock size={16} className={styles.timeSlotIcon} />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
            {errors.preferredTimeSlot && (
              <span className={styles.errorMessage}>{errors.preferredTimeSlot}</span>
            )}
            <span className={styles.helperText}>
              {formData.preferredDay === 'Saturday'
                ? 'Saturday delivery windows'
                : 'Weekday delivery windows'}
            </span>
          </div>
        )}

        {/* Delivery Instructions */}
        <div className={styles.formGroup}>
          <label htmlFor="instructions" className={styles.label}>
            <MessageSquare size={16} className={styles.labelIcon} />
            Delivery Instructions <span className={styles.optional}>(Optional)</span>
          </label>
          <textarea
            id="instructions"
            className={styles.textarea}
            value={formData.instructions || ''}
            onChange={(e) => handleFieldChange('instructions', e.target.value)}
            placeholder="Gate code, parking information, or any special instructions for our delivery driver..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            Back to Meals
          </button>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
          >
            Continue to Payment
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStep;
