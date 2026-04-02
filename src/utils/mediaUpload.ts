import { supabase } from '../supabase';

export interface MediaFile {
  file: File;
  type: 'image' | 'video';
  preview?: string; // For display before upload
}

export interface UploadedMedia {
  id: string;
  itemId: string;
  mediaType: 'image' | 'video';
  storagePath: string;
  publicUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Generate a video thumbnail from the first frame
 */
export async function generateVideoThumbnail(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Set canvas size
      canvas.width = 300;
      canvas.height = 300;
      
      // Seek to 1 second or start
      video.currentTime = Math.min(1, video.duration);
    };

    video.onseeked = () => {
      // Calculate dimensions to fit in 300x300 square
      const scale = Math.min(300 / video.videoWidth, 300 / video.videoHeight);
      const width = video.videoWidth * scale;
      const height = video.videoHeight * scale;
      const x = (300 - width) / 2;
      const y = (300 - height) / 2;

      // Draw video frame to canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(video, x, y, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
          URL.revokeObjectURL(video.src);
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get video dimensions and duration
 */
export async function getVideoMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Math.round(video.duration)
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  itemId: string
): Promise<{ storagePath: string; publicUrl: string; width: number; height: number }> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = `${userId}/${itemId}/${fileName}`;

  // Get image dimensions
  const { width, height } = await getImageDimensions(file);

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('item-media')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('item-media')
    .getPublicUrl(storagePath);

  return { storagePath, publicUrl, width, height };
}

/**
 * Upload a video to Supabase Storage with thumbnail
 */
export async function uploadVideo(
  file: File,
  userId: string,
  itemId: string
): Promise<{ 
  storagePath: string; 
  publicUrl: string; 
  thumbnailUrl: string;
  width: number;
  height: number;
  duration: number;
}> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = `${userId}/${itemId}/${fileName}`;

  // Get video metadata
  const { width, height, duration } = await getVideoMetadata(file);

  // Generate thumbnail
  const thumbnailBlob = await generateVideoThumbnail(file);
  const thumbnailFileName = `${timestamp}_thumb.jpg`;
  const thumbnailPath = `${userId}/${itemId}/${thumbnailFileName}`;

  // Upload video
  const { error: videoError } = await supabase.storage
    .from('item-media')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (videoError) {
    throw new Error(`Failed to upload video: ${videoError.message}`);
  }

  // Upload thumbnail
  const { error: thumbError } = await supabase.storage
    .from('item-media')
    .upload(thumbnailPath, thumbnailBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    });

  if (thumbError) {
    // Try to cleanup video if thumbnail fails
    await supabase.storage.from('item-media').remove([storagePath]);
    throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
  }

  // Get public URLs
  const { data: { publicUrl } } = supabase.storage
    .from('item-media')
    .getPublicUrl(storagePath);

  const { data: { publicUrl: thumbnailUrl } } = supabase.storage
    .from('item-media')
    .getPublicUrl(thumbnailPath);

  return { storagePath, publicUrl, thumbnailUrl, width, height, duration };
}

/**
 * Save item media records to database
 */
export async function saveItemMedia(
  itemId: string,
  mediaFiles: MediaFile[],
  userId: string
): Promise<UploadedMedia[]> {
  const uploadedMedia: UploadedMedia[] = [];

  for (let i = 0; i < mediaFiles.length; i++) {
    const mediaFile = mediaFiles[i];
    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let uploadResult;
      
      if (mediaFile.type === 'image') {
        uploadResult = await uploadImage(mediaFile.file, userId, itemId);
        
        const { error } = await supabase
          .from('item_media')
          .insert({
            id: mediaId,
            item_id: itemId,
            media_type: 'image',
            storage_path: uploadResult.storagePath,
            public_url: uploadResult.publicUrl,
            display_order: i,
            file_size: mediaFile.file.size,
            mime_type: mediaFile.file.type,
            width: uploadResult.width,
            height: uploadResult.height
          });

        if (error) throw error;

        uploadedMedia.push({
          id: mediaId,
          itemId,
          mediaType: 'image',
          storagePath: uploadResult.storagePath,
          publicUrl: uploadResult.publicUrl,
          displayOrder: i,
          fileSize: mediaFile.file.size,
          mimeType: mediaFile.file.type,
          width: uploadResult.width,
          height: uploadResult.height
        });
      } else {
        const videoResult = await uploadVideo(mediaFile.file, userId, itemId);
        
        const { error } = await supabase
          .from('item_media')
          .insert({
            id: mediaId,
            item_id: itemId,
            media_type: 'video',
            storage_path: videoResult.storagePath,
            public_url: videoResult.publicUrl,
            thumbnail_url: videoResult.thumbnailUrl,
            display_order: i,
            file_size: mediaFile.file.size,
            mime_type: mediaFile.file.type,
            width: videoResult.width,
            height: videoResult.height,
            duration: videoResult.duration
          });

        if (error) throw error;

        uploadedMedia.push({
          id: mediaId,
          itemId,
          mediaType: 'video',
          storagePath: videoResult.storagePath,
          publicUrl: videoResult.publicUrl,
          thumbnailUrl: videoResult.thumbnailUrl,
          displayOrder: i,
          fileSize: mediaFile.file.size,
          mimeType: mediaFile.file.type,
          width: videoResult.width,
          height: videoResult.height,
          duration: videoResult.duration
        });
      }
    } catch (error) {
      console.error(`Failed to upload media ${i}:`, error);
      // Continue with other uploads
    }
  }

  return uploadedMedia;
}

/**
 * Fetch all media for an item
 */
export async function fetchItemMedia(itemId: string): Promise<UploadedMedia[]> {
  const { data, error } = await supabase
    .from('item_media')
    .select('*')
    .eq('item_id', itemId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch item media: ${error.message}`);
  }

  return (data || []).map(media => ({
    id: media.id,
    itemId: media.item_id,
    mediaType: media.media_type,
    storagePath: media.storage_path,
    publicUrl: media.public_url,
    thumbnailUrl: media.thumbnail_url,
    displayOrder: media.display_order,
    fileSize: media.file_size,
    mimeType: media.mime_type,
    width: media.width,
    height: media.height,
    duration: media.duration
  }));
}

/**
 * Delete media from storage and database
 */
export async function deleteItemMedia(mediaId: string): Promise<void> {
  // Get media record to find storage path
  const { data: media, error: fetchError } = await supabase
    .from('item_media')
    .select('storage_path, thumbnail_url')
    .eq('id', mediaId)
    .single();

  if (fetchError || !media) {
    throw new Error('Media not found');
  }

  // Delete from storage
  const pathsToDelete = [media.storage_path];
  if (media.thumbnail_url) {
    // Extract path from thumbnail URL
    const thumbnailPath = media.thumbnail_url.split('/item-media/')[1];
    if (thumbnailPath) {
      pathsToDelete.push(thumbnailPath);
    }
  }

  const { error: storageError } = await supabase.storage
    .from('item-media')
    .remove(pathsToDelete);

  if (storageError) {
    console.error('Failed to delete from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('item_media')
    .delete()
    .eq('id', mediaId);

  if (dbError) {
    throw new Error(`Failed to delete media record: ${dbError.message}`);
  }
}

/**
 * Delete all media for an item
 */
export async function deleteAllItemMedia(itemId: string): Promise<void> {
  // First, clear the primary_media_id reference in items table
  await supabase
    .from('items')
    .update({ primary_media_id: null })
    .eq('id', itemId);
  
  const media = await fetchItemMedia(itemId);
  
  for (const m of media) {
    try {
      await deleteItemMedia(m.id);
    } catch (error) {
      console.error(`Failed to delete media ${m.id}:`, error);
    }
  }
}
