const multer = require("multer");
const path = require("path");
const fs = require("fs");
const createError = require("http-errors");
const {
  UPLOAD_USER_DOC_DIRECTORY,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} = require("../config");

if (!fs.existsSync(UPLOAD_USER_DOC_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_USER_DOC_DIRECTORY, { recursive: true });
    console.log(`Created upload directory at ${UPLOAD_USER_DOC_DIRECTORY}`);
}

const storage_asString = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_USER_DOC_DIRECTORY);
  },
  
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);

    const safeBase = base
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9-_]/g, "");

    const timestamp = Date.now();
    const userId = req.user?._id || "unknown";

    // const fileName = `${userId}_${file.fieldname}_${timestamp}${ext}`;
    const fileName = `${file.fieldname}_${userId}_${safeBase}_${timestamp}${ext}`;

    cb(null, fileName);
  },
});



const fileFilter_asString = (req, file, cb) => {

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(createError(400, "This file format is not allowed."), false);
  }
  cb(null, true);
};


const uploadUserImage = multer({
  storage: storage_asString,
  fileFilter: fileFilter_asString,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = uploadUserImage;
