const mongoose = require('mongoose');

// store schema
const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    image: {
      type: String,
    },
    description: {
      type: String
    },
    rank: {
      type: String
    },
    address: {
      type: String
    },
    phone: {
      type: String
    },
  }
);

module.exports = mongoose.model('Store', storeSchema);