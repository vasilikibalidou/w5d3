const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String
  },
  description: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author"
  },
  rating: Number
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
