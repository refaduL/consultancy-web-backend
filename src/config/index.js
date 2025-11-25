const path = require("path");

const UPLOAD_USER_DOC_DIRECTORY = path.join(__dirname, "..", "..", "uploads", "applications");
const UPLOAD_USER_IMG_DIRECTORY = "public/images/users";
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];


module.exports = {
  UPLOAD_USER_DOC_DIRECTORY,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
};
