const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Author = require("../models/Author");

router.get("/books", (req, res, next) => {
  Book.find({})
    .then(bookDocuments => {
      // we need to render in the `.then()` because that is WHEN the bookDocuments are accessible
      res.render("books.hbs", { booksList: bookDocuments });
    })
    .catch(err => {
      next(err);
    });
});

router.get("/books/add", (req, res, next) => {
  // display a form
  res.render("bookAdd.hbs");
});

router.get("/books/:id", (req, res, next) => {
  Book.findById(req.params.id)
    .populate("author")
    .then(bookDocument => {
      res.render("bookDetails.hbs", {
        book: bookDocument,
        user: req.user
      });
    })
    .catch(err => {
      next(err);
    });
});

router.get("/books/:bookId/edit", (req, res, next) => {
  const promises = [Author.find({}), Book.findById(req.params.bookId)];

  if (!req.user) {
    res.redirect("/");
    return;
  }

  Promise.all(promises)
    .then(results => {
      res.render("bookEdit.hbs", {
        book: results[1],
        authors: results[0]
      });
    })
    .catch(err => {
      next(err);
    });
  // Book.findById(req.params.bookId)
  //   .then(bookDocument => {
  //     return Author.find().then(authors => {
  //       res.render("bookEdit.hbs", {
  //         book: bookDocument,
  //         authors: authors
  //       });
  //     });
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});

router.get("/books/:bookId/delete", (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
    return;
  }
  Book.deleteOne({ _id: req.params.bookId })
    .then(() => {
      res.redirect("/books");
    })
    .catch(err => {
      next(err);
    });
});

router.post("/books/:id", (req, res, next) => {
  // const { title, description, rating, author } = req.body;
  // Book.updateOne(
  //   { _id: req.params.id },
  //   {
  //     title,
  //     description,
  //     rating,
  //     author
  //   }
  // );
  Book.updateOne(
    { _id: req.params.id },
    {
      title: req.body.title,
      description: req.body.description,
      rating: req.body.rating,
      author: req.body.author
    }
  )
    .then(() => {
      res.redirect(`/books/${req.params.id}`);
    })
    .catch(err => {
      next(err);
    });
});

router.post("/books", (req, res, next) => {
  // create a book
  Book.create({
    title: req.body.title,
    description: req.body.description,
    rating: req.body.rating,
    author: req.body.author
  })
    .then(createdBook => {
      res.redirect(`/books/${createdBook._id}`);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
