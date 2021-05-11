const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema(
  {
    lineId : {
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