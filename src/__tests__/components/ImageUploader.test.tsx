import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImageUploader } from '@/components/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';

// Mock the useImageUpload hook
jest.mock('@/hooks/useImageUpload');

// Mock fetch for API calls
global.fetch = jest.fn();

const mockUseImageUpload = useImageUpload as jest.MockedFunction<typeof useImageUpload>;

describe('ImageUploader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();

    // Default mock implementation
    mockUseImageUpload.mockReturnValue({
      upload: jest.fn(),
      uploadWithProgress: jest.fn(),
      deleteImage: jest.fn(),
      isUploading: false,
      uploadProgress: null,
      uploadedImages: [],
      error: null,
      reset: jest.fn(),
      validateFiles: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ImageUploader {...props} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render upload area with correct text', () => {
      renderComponent();
      
      expect(screen.getByText('Drag & drop images here')).toBeInTheDocument();
      expect(screen.getByText('or click to select files')).toBeInTheDocument();
    });

    it('should display max files and size information', () => {
      renderComponent({ maxFiles: 5, maxSize: 5 * 1024 * 1024 });
      
      expect(screen.getByText('Max 5 files, up to 5.0 MB each')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = renderComponent({ className: 'custom-class' });
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should be disabled when disabled prop is true', () => {
      renderComponent({ disabled: true });
      
      // Get the actual upload area div that has the CSS classes applied
      const uploadArea = screen.getByText('Drag & drop images here').closest('div')?.parentElement;
      expect(uploadArea).toHaveClass('disabled');
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via click', async () => {
      const uploadWithProgress = jest.fn();
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        uploadWithProgress,
      });

      renderComponent();
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(uploadWithProgress).toHaveBeenCalledWith([file]);
      });
    });

    it('should handle multiple file selection when multiple is true', async () => {
      const uploadWithProgress = jest.fn();
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        uploadWithProgress,
      });

      renderComponent({ multiple: true });
      
      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: files,
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(uploadWithProgress).toHaveBeenCalledWith(files);
      });
    });

    it('should validate files before upload', async () => {
      const validateFiles = jest.fn().mockReturnValue({ 
        valid: false, 
        errors: ['File too large'] 
      });
      
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        validateFiles,
      });

      renderComponent();
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(validateFiles).toHaveBeenCalledWith([file]);
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag enter event', () => {
      renderComponent();
      
      // Get the actual upload area div that has the CSS classes applied
      const uploadArea = screen.getByText('Drag & drop images here').closest('div')?.parentElement;
      
      fireEvent.dragEnter(uploadArea!);
      
      expect(uploadArea).toHaveClass('dragging');
    });

    it('should handle drag leave event', () => {
      renderComponent();
      
      // Get the actual upload area div that has the CSS classes applied
      const uploadArea = screen.getByText('Drag & drop images here').closest('div')?.parentElement;
      
      fireEvent.dragEnter(uploadArea!);
      fireEvent.dragLeave(uploadArea!);
      
      expect(uploadArea).not.toHaveClass('dragging');
    });

    it('should handle file drop', async () => {
      const uploadWithProgress = jest.fn();
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        uploadWithProgress,
      });

      renderComponent();
      
      // Get the actual upload area div that has the CSS classes applied
      const uploadArea = screen.getByText('Drag & drop images here').closest('div')?.parentElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      const dataTransfer = {
        files: [file],
      };
      
      fireEvent.drop(uploadArea!, { dataTransfer });
      
      await waitFor(() => {
        expect(uploadWithProgress).toHaveBeenCalledWith([file]);
      });
    });

    it('should not handle drop when disabled', () => {
      const uploadWithProgress = jest.fn();
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        uploadWithProgress,
      });

      renderComponent({ disabled: true });
      
      // Get the actual upload area div that has the CSS classes applied
      const uploadArea = screen.getByText('Drag & drop images here').closest('div')?.parentElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      const dataTransfer = {
        files: [file],
      };
      
      fireEvent.drop(uploadArea!, { dataTransfer });
      
      expect(uploadWithProgress).not.toHaveBeenCalled();
    });
  });

  describe('Upload Progress', () => {
    it('should display upload progress', () => {
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        isUploading: true,
        uploadProgress: {
          loaded: 5242880,
          total: 10485760,
          percentage: 50,
        },
      });

      renderComponent();
      
      expect(screen.getByText('Uploading... 50%')).toBeInTheDocument();
      expect(screen.getByText('5.0 MB / 10.0 MB')).toBeInTheDocument();
    });

    it('should show progress bar with correct width', () => {
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        isUploading: true,
        uploadProgress: {
          loaded: 7340032,
          total: 10485760,
          percentage: 70,
        },
      });

      renderComponent();
      
      const progressFill = document.querySelector('.progressFill');
      expect(progressFill).toHaveStyle({ width: '70%' });
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        error: new Error('Upload failed'),
      });

      renderComponent();
      
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  describe('Image Preview', () => {
    it('should display uploaded images when showPreview is true', () => {
      const uploadedImages = [
        {
          url: 'https://example.com/image1.jpg',
          publicId: 'test/image1',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
          thumbnailUrl: 'https://example.com/thumb1.jpg',
        },
      ];

      renderComponent({ showPreview: true, initialImages: uploadedImages });
      
      expect(screen.getByText('Uploaded Images')).toBeInTheDocument();
      expect(screen.getByText('image1')).toBeInTheDocument();
      expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
      expect(screen.getByText('800 × 600')).toBeInTheDocument();
    });

    it('should not display preview when showPreview is false', () => {
      const uploadedImages = [
        {
          url: 'https://example.com/image1.jpg',
          publicId: 'test/image1',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        },
      ];

      renderComponent({ showPreview: false, initialImages: uploadedImages });
      
      expect(screen.queryByText('Uploaded Images')).not.toBeInTheDocument();
    });

    it('should handle image deletion', async () => {
      const deleteImage = jest.fn();
      const onImageDelete = jest.fn();
      
      mockUseImageUpload.mockReturnValue({
        ...mockUseImageUpload(),
        deleteImage,
      });

      const uploadedImages = [
        {
          url: 'https://example.com/image1.jpg',
          publicId: 'test/image1',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 1024000,
        },
      ];

      renderComponent({ 
        showPreview: true, 
        initialImages: uploadedImages,
        onImageDelete,
      });
      
      const deleteButton = screen.getByLabelText('Delete image');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(deleteImage).toHaveBeenCalledWith('test/image1');
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onUploadComplete when upload succeeds', async () => {
      const onUploadComplete = jest.fn();
      const uploadedImage = {
        url: 'https://example.com/image.jpg',
        publicId: 'test/image',
        width: 800,
        height: 600,
        format: 'jpg',
        size: 1024000,
      };

      const uploadWithProgress = jest.fn();
      mockUseImageUpload.mockImplementation((options) => {
        // Simulate successful upload
        if (options?.onSuccess) {
          setTimeout(() => {
            options.onSuccess(uploadedImage);
          }, 0);
        }
        
        return {
          upload: jest.fn(),
          uploadWithProgress,
          deleteImage: jest.fn(),
          isUploading: false,
          uploadProgress: null,
          uploadedImages: [],
          error: null,
          reset: jest.fn(),
          validateFiles: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        };
      });

      renderComponent({ onUploadComplete });
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalledWith([uploadedImage]);
      });
    });
  });
});