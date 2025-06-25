const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'de1w93ele',
  api_key: '833219781348539',
  api_secret: 'qviSRgBdHUO5In8U8rLSB6ZH_to',
});

const upload = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => ({
      folder: folder,
      resource_type: file.mimetype.startsWith("image/") ? "image" : file.mimetype.startsWith("video/") ? "video" : "raw",
    }),
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/", "video/", "application/pdf"];
      const isValidType = allowedTypes.some(type => file.mimetype.startsWith(type));
      if (!isValidType) {
        return cb(new Error("Only image, video, and PDF files are allowed"), false);
      }
      cb(null, true);
    },
  });
};

module.exports = upload;