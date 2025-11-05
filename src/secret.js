require("dotenv").config();

const serverPort = process.env.SERVER_PORT || 3002;
const mongodbUrl = process.env.MONGODB_ATLAS_URL;
const defaultImagepath = process.env.DEFAULT_USER_IMAGE_PATH || 'public/images/users/default.png';

const jwtActivationKey = process.env.JWT_ACTIVATION_KEY || 'asdfg_lkjh';
const jwtAccessKey = process.env.JWT_ACCESS_KEY || 'asdfg_lkjh';
const smtpUsername = process.env.SMTP_USERNAME || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const clientURL = process.env.CLIENT_URL || '';



module.exports = { serverPort, mongodbUrl, defaultImagepath, jwtActivationKey, jwtAccessKey, smtpUsername, smtpPassword, clientURL };