const fs = require("fs/promises");

const deleteImage = async (userImagePath) => {

    try {
        console.log("deleting image...");
        await fs.access(userImagePath);
        await fs.unlink(userImagePath);
        console.log("user image was deleted");
    } catch (error) {
        console.error("user image does not exist");
        // you may choose to throw an error if needed
        throw error;
    }
}
module.exports = { deleteImage };
