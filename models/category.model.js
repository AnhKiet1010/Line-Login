const mongoose = require('mongoose');

// category schema
const categorySchema = new mongoose.Schema(
  {
    name : {
        type: String
    },
    child: {
      type: Array,
    },
  }
);

module.exports = mongoose.model('Category', categorySchema);