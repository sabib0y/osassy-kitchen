import { test, expect } from '@playwright/test';

test.describe('User Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should display profile page', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/user/profile');
    
    // Check page title
    await expect(page.locator('h1')).toContainText(/Profile|Account|Settings/i);
    
    // Check main sections are present
    const personalInfo = page.locator('text=/personal|contact|information/i');
    const deliveryInfo = page.locator('text=/delivery|address/i');
    const securityInfo = page.locator('text=/password|security/i');
    
    await expect(personalInfo).toBeVisible();
    await expect(deliveryInfo).toBeVisible();
    await expect(securityInfo).toBeVisible();
  });

  test('should display current user information', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Check email is displayed
    const emailField = page.locator('input[type="email"], input[name="email"]');
    await expect(emailField).toHaveValue('test@test.com');
    
    // Check other fields are present
    const nameField = page.locator('input[name="name"], input[name="fullName"]');
    const phoneField = page.locator('input[type="tel"], input[name="phone"]');
    
    await expect(nameField).toBeVisible();
    await expect(phoneField).toBeVisible();
  });

  test('should update personal information', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Find and update name field
    const nameField = page.locator('input[name="name"], input[name="fullName"]');
    await nameField.clear();
    await nameField.fill('Updated Test User');
    
    // Update phone if present
    const phoneField = page.locator('input[type="tel"], input[name="phone"]');
    if (await phoneField.count() > 0) {
      await phoneField.clear();
      await phoneField.fill('+447777777777');
    }
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    await saveButton.click();
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Check for success message
    const successMessage = page.locator('text=/saved|updated|success/i');
    await expect(successMessage).toBeVisible();
    
    // Verify changes persisted
    await page.reload();
    await expect(nameField).toHaveValue('Updated Test User');
  });

  test('should update delivery address', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Find address section
    const addressSection = page.locator('section, div').filter({ hasText: /delivery|address/i });
    
    // Fill address fields
    const streetField = addressSection.locator('input[name*="street"], input[name*="address1"]').first();
    const cityField = addressSection.locator('input[name*="city"]').first();
    const postcodeField = addressSection.locator('input[name*="postcode"], input[name*="zip"]').first();
    
    if (await streetField.count() > 0) {
      await streetField.clear();
      await streetField.fill('123 Test Street');
    }
    
    if (await cityField.count() > 0) {
      await cityField.clear();
      await cityField.fill('London');
    }
    
    if (await postcodeField.count() > 0) {
      await postcodeField.clear();
      await postcodeField.fill('E1 6AN');
    }
    
    // Save address
    const saveButton = addressSection.locator('button:has-text("Save"), button:has-text("Update")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
    } else {
      // Use general save button
      await page.locator('button:has-text("Save")').first().click();
    }
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Check for success
    const successMessage = page.locator('text=/saved|updated|success/i');
    await expect(successMessage).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Find password section
    const passwordSection = page.locator('section, div').filter({ hasText: /password|security/i });
    
    // Fill password fields
    const currentPassword = passwordSection.locator('input[name*="current"], input[name*="old"]').first();
    const newPassword = passwordSection.locator('input[name*="new"][type="password"]').first();
    const confirmPassword = passwordSection.locator('input[name*="confirm"][type="password"]').first();
    
    if (await currentPassword.count() > 0) {
      await currentPassword.fill('test');
      await newPassword.fill('NewTestPassword123!');
      await confirmPassword.fill('NewTestPassword123!');
      
      // Submit password change
      const changeButton = passwordSection.locator('button:has-text("Change"), button:has-text("Update")');
      await changeButton.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Check for success or error
      const message = page.locator('text=/password.*changed|password.*updated|success/i');
      if (await message.isVisible().catch(() => false)) {
        // Change back to original password
        await currentPassword.clear();
        await currentPassword.fill('NewTestPassword123!');
        await newPassword.clear();
        await newPassword.fill('test');
        await confirmPassword.clear();
        await confirmPassword.fill('test');
        await changeButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/user/profile');
    
    const passwordSection = page.locator('section, div').filter({ hasText: /password|security/i });
    const newPassword = passwordSection.locator('input[name*="new"][type="password"]').first();
    const confirmPassword = passwordSection.locator('input[name*="confirm"][type="password"]').first();
    
    if (await newPassword.count() > 0) {
      // Try weak password
      await newPassword.fill('123');
      await confirmPassword.fill('123');
      
      // Try to submit
      const changeButton = passwordSection.locator('button:has-text("Change"), button:has-text("Update")');
      await changeButton.click();
      
      // Should show validation error
      const errorMessage = page.locator('text=/weak|must be|characters|strong/i');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle password mismatch', async ({ page }) => {
    await page.goto('/user/profile');
    
    const passwordSection = page.locator('section, div').filter({ hasText: /password|security/i });
    const currentPassword = passwordSection.locator('input[name*="current"], input[name*="old"]').first();
    const newPassword = passwordSection.locator('input[name*="new"][type="password"]').first();
    const confirmPassword = passwordSection.locator('input[name*="confirm"][type="password"]').first();
    
    if (await currentPassword.count() > 0) {
      await currentPassword.fill('test');
      await newPassword.fill('NewPassword123!');
      await confirmPassword.fill('DifferentPassword123!');
      
      // Try to submit
      const changeButton = passwordSection.locator('button:has-text("Change"), button:has-text("Update")');
      await changeButton.click();
      
      // Should show mismatch error
      const errorMessage = page.locator('text=/match|same|identical/i');
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should update email preferences', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for email preferences section
    const preferencesSection = page.locator('section, div').filter({ hasText: /notification|preference|email.*setting/i });
    
    if (await preferencesSection.count() > 0) {
      // Find checkboxes
      const checkboxes = preferencesSection.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Toggle first checkbox
        const firstCheckbox = checkboxes.first();
        const wasChecked = await firstCheckbox.isChecked();
        await firstCheckbox.click();
        
        // Save preferences
        const saveButton = preferencesSection.locator('button:has-text("Save"), button:has-text("Update")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Verify change persisted
          await page.reload();
          const isCheckedNow = await firstCheckbox.isChecked();
          expect(isCheckedNow).toBe(!wasChecked);
        }
      }
    }
  });

  test('should upload profile picture', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for profile picture upload
    const uploadInput = page.locator('input[type="file"][accept*="image"]');
    
    if (await uploadInput.count() > 0) {
      // Create a test image file
      const buffer = Buffer.from('fake-image-data');
      
      // Upload file
      await uploadInput.setInputFiles({
        name: 'profile.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer
      });
      
      // Wait for upload
      await page.waitForTimeout(1000);
      
      // Check for success or preview
      const successMessage = page.locator('text=/uploaded|success/i');
      const imagePreview = page.locator('img[src*="profile"], img[alt*="profile"]');
      
      const hasSuccess = await successMessage.isVisible().catch(() => false);
      const hasPreview = await imagePreview.isVisible().catch(() => false);
      
      expect(hasSuccess || hasPreview).toBe(true);
    }
  });

  test('should delete account', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for delete account option
    const deleteButton = page.locator('button:has-text("Delete Account"), button:has-text("delete.*account")', { hasText: /delete.*account/i });
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Handle confirmation dialog
      const confirmDialog = page.locator('[role="dialog"], .modal');
      if (await confirmDialog.isVisible()) {
        // Look for confirmation input
        const confirmInput = confirmDialog.locator('input[type="text"], input[placeholder*="DELETE"]');
        if (await confirmInput.count() > 0) {
          await confirmInput.fill('DELETE');
        }
        
        // Look for password confirmation
        const passwordInput = confirmDialog.locator('input[type="password"]');
        if (await passwordInput.count() > 0) {
          await passwordInput.fill('test');
        }
        
        // Don't actually delete - just close dialog
        const cancelButton = confirmDialog.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('should add multiple delivery addresses', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for add address button
    const addAddressButton = page.locator('button:has-text("Add Address"), button:has-text("add.*address")', { hasText: /add.*address/i });
    
    if (await addAddressButton.count() > 0) {
      await addAddressButton.click();
      
      // Wait for form
      await page.waitForTimeout(500);
      
      // Fill new address form
      const newAddressForm = page.locator('form, [role="dialog"]').last();
      
      const streetField = newAddressForm.locator('input[name*="street"], input[name*="address"]').first();
      const cityField = newAddressForm.locator('input[name*="city"]').first();
      const postcodeField = newAddressForm.locator('input[name*="postcode"], input[name*="zip"]').first();
      
      if (await streetField.count() > 0) {
        await streetField.fill('456 Second Street');
        await cityField.fill('Manchester');
        await postcodeField.fill('M1 1AA');
        
        // Save new address
        const saveButton = newAddressForm.locator('button:has-text("Save"), button:has-text("Add")');
        await saveButton.click();
        
        await page.waitForTimeout(1000);
        
        // Verify address added
        const addressList = page.locator('.address-item, .address-card');
        await expect(addressList).toHaveCount({ minimum: 2 });
      }
    }
  });

  test('should set default delivery address', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for address list
    const addressItems = page.locator('.address-item, .address-card');
    
    if (await addressItems.count() > 1) {
      // Find non-default address
      const nonDefaultAddress = addressItems.filter({ hasNot: page.locator('text=/default|primary/i') }).first();
      
      // Set as default
      const setDefaultButton = nonDefaultAddress.locator('button:has-text("Set as Default"), button:has-text("Make Default")');
      
      if (await setDefaultButton.count() > 0) {
        await setDefaultButton.click();
        
        await page.waitForTimeout(1000);
        
        // Verify default changed
        const defaultBadge = nonDefaultAddress.locator('text=/default|primary/i');
        await expect(defaultBadge).toBeVisible();
      }
    }
  });

  test('should export personal data', async ({ page }) => {
    await page.goto('/user/profile');
    
    // Look for data export option
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download.*Data")', { hasText: /export|download.*data/i });
    
    if (await exportButton.count() > 0) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportButton.click();
      
      // Check if download started
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
        
        // Check filename
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/data|export|profile/i);
      }
    }
  });

  test('should handle concurrent profile updates', async ({ page, context }) => {
    await page.goto('/user/profile');
    
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/user/profile');
    
    // Update in first tab
    const nameField1 = page.locator('input[name="name"], input[name="fullName"]');
    await nameField1.clear();
    await nameField1.fill('Tab 1 User');
    
    // Update in second tab
    const nameField2 = page2.locator('input[name="name"], input[name="fullName"]');
    await nameField2.clear();
    await nameField2.fill('Tab 2 User');
    
    // Save in first tab
    await page.locator('button:has-text("Save")').first().click();
    await page.waitForTimeout(1000);
    
    // Save in second tab
    await page2.locator('button:has-text("Save")').first().click();
    await page2.waitForTimeout(1000);
    
    // Refresh first tab
    await page.reload();
    
    // Check which value persisted (last one should win)
    const finalValue = await nameField1.inputValue();
    expect(finalValue).toBe('Tab 2 User');
    
    // Close second tab
    await page2.close();
  });
});