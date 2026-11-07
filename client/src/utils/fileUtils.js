/**
 * File & Media Utility Helpers
 */

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType = '', fileName = '') => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
    return 'ri-image-2-line';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'ri-file-pdf-2-line';
  }
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext) || mimeType.includes('word') || mimeType.includes('text')) {
    return 'ri-file-text-line';
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return 'ri-file-excel-2-line';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'ri-video-line';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) {
    return 'ri-music-2-line';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'ri-folder-zip-line';
  }
  return 'ri-attachment-2';
};

export const isImageFile = (mimeType = '', fileName = '') => {
  const ext = fileName.split('.').pop().toLowerCase();
  return mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
};
