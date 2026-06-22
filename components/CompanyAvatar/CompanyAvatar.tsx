import React from 'react';
import { cn } from '@/lib/utils';
import { storageService } from '@/utils/storage/storage';

const avatarSizes = {
  md: 'h-14 w-14 text-xl',
  lg: 'h-20 w-20 text-2xl',
};

interface CompanyAvatarProps {
  name: string;
  logo?: string | null;
  size?: keyof typeof avatarSizes;
  className?: string;
  /** Enable upload mode */
  editable?: boolean;
  /** Callback when upload completes */
  onUpload?: (logoPath: string) => void;
  /** Current upload state */
  isUploading?: boolean;
}

function getCompanyInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Convert storage path to public URL
 * If path is already a full URL (http/https), return as-is
 * If path is a storage path (starts with 'logos/'), convert to public URL
 */
function resolveLogoUrl(logo?: string | null): string | null {
  if (!logo) return null;

  // If it's already a full URL (http/https)
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  // If it's a storage path, convert to public URL
  if (logo.startsWith('logos/')) {
    return storageService.getLogoUrl(logo);
  }

  // Unknown format, return null to show fallback
  console.warn('Unknown logo format:', logo);
  return null;
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  name,
  logo,
  size = 'md',
  className,
  editable = false,
  onUpload,
  isUploading = false,
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const shouldShowImage = !!(editable ? previewUrl : resolveLogoUrl(logo)) && !imageFailed;
  const resolvedUrl = editable ? previewUrl : resolveLogoUrl(logo);

  React.useEffect(() => {
    if (!editable) {
      setImageFailed(false);
    }
  }, [logo, editable]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 500 * 1024; // 500KB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

    if (file.size > maxSize) {
      alert(`File size too large. Maximum ${maxSize / 1024}KB allowed.`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PNG, JPEG, and WebP are allowed.');
      return;
    }

    setUploading(true);

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload via parent callback or directly
      if (onUpload) {
        const result = await onUpload(file);
        // Parent handles the upload and state update
      } else {
        // Direct upload (if needed)
        const { url } = await storageService.uploadLogo(file, 'temp');
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const uploadButton = (
    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
      <input
        type="file"
        className="hidden"
        accept=".png,.jpeg,.jpg,.webp"
        onChange={handleFileChange}
        disabled={uploading || isUploading}
      />
      <div className="text-center text-white">
        {uploading || isUploading ? (
          <div className="flex h-8 w-8 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-1 text-xs">Change logo</p>
          </>
        )}
      </div>
    </label>
  );

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-muted-foreground',
        avatarSizes[size],
        className,
        editable && 'relative cursor-pointer group'
      )}
      aria-hidden={shouldShowImage ? undefined : true}
    >
      {shouldShowImage ? (
        <img
          src={resolvedUrl!}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="font-semibold">{getCompanyInitial(name)}</span>
      )}

      {editable && uploadButton}
    </div>
  );
};
