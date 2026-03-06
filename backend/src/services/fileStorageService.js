const fs = require('fs');
const { URL } = require('url');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

class FileStorageService {
  static isCloudinaryEnabled() {
    return hasCloudinaryConfig;
  }

  static async persistUploadedFile(file) {
    if (!file) {
      throw new Error('File is required');
    }

    if (!this.isCloudinaryEnabled()) {
      return { filePath: file.path };
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: process.env.CLOUDINARY_FOLDER || 'sprintboard/tasks',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    this.deleteLocalTempFile(file.path);
    return { filePath: uploadResult.secure_url };
  }

  static deleteLocalTempFile(localPath) {
    if (!localPath) return;
    if (!fs.existsSync(localPath)) return;
    try {
      fs.unlinkSync(localPath);
    } catch (error) {
      console.warn('[file_storage_local_cleanup_failed]', {
        filePath: localPath,
        message: error?.message
      });
    }
  }

  static isCloudinaryUrl(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;
    return filePath.includes('res.cloudinary.com/');
  }

  static mapMimeToResourceType(mimeType) {
    if (!mimeType) return 'raw';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  static extractCloudinaryPublicId(filePath) {
    try {
      const parsed = new URL(filePath);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex < 0) return null;

      let tail = parts.slice(uploadIndex + 1);
      if (tail.length === 0) return null;

      // drop optional version segment (e.g. v1712345678)
      if (/^v\d+$/.test(tail[0])) {
        tail = tail.slice(1);
      }
      if (tail.length === 0) return null;

      const joined = tail.join('/');
      const ext = path.extname(joined);
      return ext ? joined.slice(0, -ext.length) : joined;
    } catch (_error) {
      return null;
    }
  }

  static async deleteStoredFile(filePath, mimeType) {
    if (!filePath) return;

    if (this.isCloudinaryEnabled() && this.isCloudinaryUrl(filePath)) {
      const publicId = this.extractCloudinaryPublicId(filePath);
      if (!publicId) {
        console.warn('[file_storage_cloudinary_public_id_parse_failed]', { filePath });
        return;
      }

      const resourceType = this.mapMimeToResourceType(mimeType);
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = FileStorageService;
