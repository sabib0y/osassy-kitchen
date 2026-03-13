import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UserProfile, ProfileFormData, ProfileFormErrors } from '../../types/user';
import styles from '../../styles/components/user/profile.module.scss';

interface ProfileFormProps {
  profile: UserProfile | null;
  onUpdate: (data: ProfileFormData) => Promise<void>;
  loading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onUpdate, loading }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!isDirty) {
      setMessage({ type: 'error', text: 'No changes to save.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await onUpdate(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      reset(data); // Reset form with new values to clear dirty state
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePhone = (value: string) => {
    if (!value) return true; // Phone is optional
    const phoneRegex = /^(\+?[\d\s\-\(\)]{10,}|\+?44[\d\s\-]{10,})$/;
    return phoneRegex.test(value.replace(/\s/g, '')) || 'Please enter a valid phone number';
  };

  const validateName = (value: string) => {
    if (!value) return 'Full name is required';
    if (value.length < 2) return 'Name must be at least 2 characters long';
    if (value.length > 50) return 'Name must be less than 50 characters';
    return true;
  };

  if (loading) {
    return (
      <div className={styles.formLoading} data-testid="profile-form-loading">
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileForm}>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Name Field */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              <i className="fas fa-user"></i>
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Enter your full name"
              {...register('name', {
                validate: validateName
              })}
              disabled={isSubmitting}
            />
            {errors.name && (
              <span className={styles.errorMessage}>
                <i className="fas fa-exclamation-triangle"></i>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              <i className="fas fa-envelope"></i>
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${styles.inputDisabled}`}
              value={profile?.email || ''}
              disabled={true}
              readOnly
            />
            <small className={styles.helpText}>
              <i className="fas fa-info-circle"></i>
              Email cannot be changed. Contact support if you need to update your email.
            </small>
          </div>

          {/* Phone Field */}
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              <i className="fas fa-phone"></i>
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              placeholder="Enter your phone number (optional)"
              {...register('phone', {
                validate: validatePhone
              })}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <span className={styles.errorMessage}>
                <i className="fas fa-exclamation-triangle"></i>
                {errors.phone.message}
              </span>
            )}
            <small className={styles.helpText}>
              <i className="fas fa-info-circle"></i>
              We&apos;ll use this for order updates and delivery notifications.
            </small>
          </div>
        </div>

        {/* Account Information */}
        <div className={styles.accountInfo}>
          <h3>
            <i className="fas fa-shield-alt"></i>
            Account Information
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Account Status</span>
              <span className={`${styles.badge} ${styles.success}`}>
                <i className="fas fa-check-circle"></i>
                Active
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email Verified</span>
              <span className={`${styles.badge} ${profile?.emailVerified ? styles.success : styles.warning}`}>
                <i className={`fas ${profile?.emailVerified ? 'fa-check-circle' : 'fa-clock'}`}></i>
                {profile?.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Member Since</span>
              <span className={styles.infoValue}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => reset()}
            disabled={isSubmitting || !isDirty}
          >
            <i className="fas fa-undo"></i>
            Reset Changes
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;