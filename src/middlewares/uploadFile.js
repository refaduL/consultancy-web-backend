const multer = require("multer");
const path = require("path");
const createError = require("http-errors");
const {
  UPLOAD_USER_IMG_DIRECTORY,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} = require("../config");


// const storage_forBuffer = multer.memoryStorage();

const storage_forString = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_USER_IMG_DIRECTORY);
  },
  filename: function (req, file, cb) {
    const extName = path.extname(file.originalname);
    const fileName = Date.now() + "-" + file.originalname.replace(extName, "") + extName;
    cb(null, fileName);

    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});



const fileFilter_forString = (req, file, cb) => {

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(createError(400, "File type not allowed."), false);
  }
  cb(null, true);
};

// const fileFilter_forBuffer = (req, file, cb) => {
//   if (!file.mimetype.startsWith("image/")) {
//     return cb(new Error("Only img files are allowed"), false);
//   }
//   if (file.size > MAX_FILE_SIZE) {
//     return cb(new Error("File size exceeds maximum limit"), false);
//   }
//   if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
//     return cb(new Error("File type is not allowed"), false);
//   }
//   cb(null, true);
// };

const uploadUserImage = multer({
  storage: storage_forString,
  fileFilter: fileFilter_forString,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = uploadUserImage;
