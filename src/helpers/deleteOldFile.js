const fs = require("fs");
const path = require("path");

const deleteFile = (relativePath) => {
  if (!relativePath) return;
  console.log("Attempting to delete file:" , relativePath);
  try {
    const absolutePath = path.join(__dirname, "..", "..", relativePath); // starts from "server/relativePath/to/file"

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log("Deleted old file:", absolutePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
};

module.exports = deleteFile;
