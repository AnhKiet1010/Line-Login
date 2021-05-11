const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema(
  {
    id : {
        type: String
    },
    name: {
      type: String,
    },
    avatar: {
        type: String
    },
    statusMessage: {
        type: String
    },
    email: {
        type: String
    }
  }
);

module.exports = mongoose.model('User', userSchema);