import multer from 'multer';

// Use memory storage — files are uploaded to Cloudinary directly from buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
};

const attachmentFilter = (req, file, cb) => {
    // Allow any file type for attachments
    cb(null, true);
};

// Upload config for cover images (images only, 5MB limit)
export const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Upload config for attachments (any file type, 20MB limit)
export const uploadFile = multer({
    storage: multer.memoryStorage(),
    fileFilter: attachmentFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});
