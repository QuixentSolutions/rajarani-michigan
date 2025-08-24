const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },

  registrationDate: {
    type: Date,
    default: Date.now
  },
  anniversaryDate: {
    type: String
  }
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
