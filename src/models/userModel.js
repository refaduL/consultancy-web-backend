const {Schema, model} = require("mongoose");
const bcrypt = require("bcryptjs");
const { defaultImagepath } = require("../secret");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    minlength: [3, 'The length of Username should be maximum 3 char'],
    maxlength: [31, 'The length of Username can be maximum 31 char'],
  },
  email: {
    type: String,
    required: [true, 'User email is required'],
    trim: true,
    unique: [true, 'email already exists'],
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'User password is required'],
    minlength: [6, 'The length of User password should be minimum 6 char'],
    // maxlength: [31, 'The length of User password can be maximum 31 char'],
    set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)),
  },
  address: {
    type: String,
    required: [true, 'User address is required'],
    trim: true,
    minlength: [3, 'The length of address should be manimum 3 char'],
  },
  image: {
    type: String,
    default: defaultImagepath,

    // type: Buffer,
    // contentType: String,
    // required: [true, 'User image is required'],

  },
  phone: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
}, {timestamps: true});


const User = model('Users', userSchema);

module.exports = User;