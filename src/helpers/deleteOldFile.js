const fs = require("fs");
const path = require("path");

const deleteFile = (filePath) => {
  if (!filePath) return;
  console.log("Attempting to delete file:" , filePath);
  try {
    const absolutePath = filePath;
    // const absolutePath = path.join(__dirname, "..", "..", filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log("Deleted old file:", absolutePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err.message);
  }
};

module.exports = deleteFile;
