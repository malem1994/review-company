import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export const storageService = {
  /**
   * Upload logo file to Supabase Storage
   * @param file - The image file to upload
   * @param companyId - Company ID for folder organization
   * @returns Object containing storage path and public URL
   */
  async uploadLogo(file: File, companyId: string): Promise<{ path: string; url: string }> {
    // Validate file size (max 500KB)
    const maxSize = 500 * 1024; // 500KB in bytes
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum ${maxSize / 1024}KB allowed.`);
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPEG, and WebP are allowed.');
    }

    // Generate unique filename: timestamp-random-originalname
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${timestamp}-${random}.${fileExt}`;
    const filePath = `logos/${companyId}/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        upsert: false, // Don't overwrite existing files
        contentType: file.type,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  },

  /**
   * Get public URL for a stored logo
   * @param path - Storage path (e.g., 'logos/company-id/filename.png')
   * @returns Public URL
   */
  getLogoUrl(path: string): string {
    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete logo from storage
   * @param path - Storage path to delete
   */
  async deleteLogo(path: string): Promise<void> {
    if (!path) return;

    try {
      const { error } = await supabase.storage
        .from('logos')
        .remove([path]);

      if (error) {
        console.error('Storage delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (err) {
      // If file doesn't exist, don't throw
      if (err instanceof Error && err.message.includes('not found')) {
        return;
      }
      throw err;
    }
  },

  /**
   * List all logos for a company
   * @param companyId - Company ID
   * @returns Array of file names
   */
  async listCompanyLogos(companyId: string): Promise<string[]> {
    const { data } = await supabase.storage
      .from('logos')
      .list(companyId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    return data?.map(file => file.name) || [];
  },

  /**
   * Get file info (size, created_at, etc.)
   * @param path - Storage path
   */
  async getFileInfo(path: string) {
    const { data } = await supabase.storage
      .from('logos')
      .list('', {
        limit: 1,
        prefix: path,
      });

    return data?.[0] || null;
  }
};
