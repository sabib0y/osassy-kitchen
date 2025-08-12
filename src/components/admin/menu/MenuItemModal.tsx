import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2 } from 'lucide-react';
import { MenuItem, MenuCategory, CreateMenuItemData, UpdateMenuItemData } from '@/types/admin';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/admin/useMenu';
import { ButtonLoading } from '../shared/LoadingSpinner';
import { ImageUploader } from '@/components/ImageUploader';
import { UploadedImage } from '@/hooks/useImageUpload';
import styles from '@/styles/components/admin/menu.module.scss';

interface MenuItemModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: 'main-dishes', label: 'Main Dishes' },
  { value: 'soups', label: 'Soups' },
  { value: 'rice-dishes', label: 'Rice Dishes' },
  { value: 'grilled', label: 'Grilled' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'sides', label: 'Sides' },
];

export default function MenuItemModal({ 
  item, 
  isOpen, 
  mode, 
  onClose, 
  onSuccess 
}: MenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '' as MenuCategory,
    available: true,
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingImage, setExistingImage] = useState<{
    url: string;
    publicId: string;
    thumbnailUrl?: string;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setFormData({
          name: item.name,
          description: item.description,
          price: item.price.toString(),
          category: item.category,
          available: item.available,
        });
        
        // Set existing image if available
        if (item.imageUrl) {
          setExistingImage({
            url: item.imageUrl,
            publicId: '', // We'll handle this when integrating with real API
            thumbnailUrl: item.imageUrl.replace('/upload/', '/upload/c_fill,h_200,w_200/'),
          });
        }
      } else {
        // Reset for create mode
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'main-dishes',
          available: true,
        });
        setExistingImage(null);
      }
      setUploadedImages([]);
      setErrors({});
    }
  }, [isOpen, mode, item]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (images: UploadedImage[]) => {
    setUploadedImages(images);
    // Clear any existing image when new one is uploaded
    if (images.length > 0) {
      setExistingImage(null);
    }
  };

  const handleImageDelete = (publicId: string) => {
    setUploadedImages(prev => prev.filter(img => img.publicId !== publicId));
  };

  const handleExistingImageDelete = () => {
    setExistingImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const imageData = uploadedImages[0] || existingImage;
      
      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        available: formData.available,
        imageUrl: imageData?.url,
        imagePublicId: imageData?.publicId,
        thumbnailUrl: imageData?.thumbnailUrl,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(menuItemData as CreateMenuItemData);
      } else if (item) {
        await updateMutation.mutateAsync({
          ...menuItemData,
          id: item.id,
        } as UpdateMenuItemData);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save menu item:', error);
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const currentImage = uploadedImages[0] || existingImage;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add Menu Item' : 'Edit Menu Item'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Item Image
                </label>
                
                {/* Current Image Preview */}
                {currentImage && (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <img
                        src={currentImage.thumbnailUrl || currentImage.url}
                        alt="Current menu item"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={existingImage ? handleExistingImageDelete : () => handleImageDelete(currentImage.publicId)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Current image will be used. Upload a new image to replace it.
                    </p>
                  </div>
                )}

                {/* Image Uploader */}
                {!currentImage && (
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    onImageDelete={handleImageDelete}
                    maxFiles={1}
                    multiple={false}
                    folder="osassy-kitchen/menu-items"
                    tags={['menu-item']}
                    className="mb-4"
                  />
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter menu item name"
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Describe the menu item"
                    disabled={isLoading}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (£) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Available for ordering
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ButtonLoading size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {mode === 'create' ? 'Create Item' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}