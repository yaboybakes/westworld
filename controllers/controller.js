var express = require('express');
var router = express.Router();
var request = require('request');

// Set our models (require schemas)
var Note = require('../models/Note.js');
var Article = require('../models/Article.js');

// Scrapers
var mongoose = require('mongoose');
var cheerio = require('cheerio');

// Database configuration with mongoose  (this is where mongo URI goes)
mongoose.connect(
	'mongodb://localhost/scraperbike');
var db = mongoose.connection;

// Show any mongoose errors
db.on('error', function (err) {
	console.log('Mongoose Error: ', err);
});

//Logged in to db through mongoose, log message
db.once('open', function() {
	console.log('Mongoose connection successful.');
});

// Route for home
router.get('/', function(req, res) {
	res.redirect('/home');
});

// Route using site and cheerio
router.get('/home', function(req, res) {
			request("https://news.ycombinator.com/", function(error, response, html) {
			// Load the html body from request into cheerio
			var $ = cheerio.load(html);

			// For each element with a "title" class
			$(".title").each(function(i, element) {
			// Save the text of each link enclosed in the current element
			var result = {};
			result.title = $(this).children("a").text();
			// Save the href value of each link enclosed in the current element
			result.link = $(this).children("a").attr("href");

			var entry = new Article (result);

			entry.save(function(err, doc) {
			  if (err) {
			    console.log(err);
			  } else {
			    console.log(doc);
			  }
			});
		});
	});
	res.render('home');
});

// Route to see articles saved
router.get('/articles', function(req, res) {
	Article.find({}, function(err, doc){
		if (err) {
			console.log(err);
		} else {
			res.json(doc); //this is where json is displayed
		}
	});
});

// Route
router.get('/articles/:id', function(req, res) {
	Article.findOne({'_id': req.params.id})
	.populate('note')
	.exec(function(err, doc) {
		if (err) {
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});


// Route to delete notes
router.get('/deletenote/:id', function(req, res) {
	console.log("id is " + req.params.id);
	console.log(req.params);
	Note.remove({ '_id': req.params.id })
	// .remove('note')
	.exec(function(err, doc) {
		if (err) {
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});


// Route to replace existing note of article with new one
router.post('/articles/:id', function(req, res) {
	var newNote = new Note(req.body);
	console.log("saving");
	newNote.save(function(err, doc) {
		if (err) {
			console.log(err);
		} else {
			Article.findOneAndUpdate({'_id': req.params.id},{$push: {'note':doc._id}},{new: true })
			.exec(function(err, doc) {
				if (err) {
					console.log(err);
				} else {
					res.send(doc);
				}
			});
		}
	});
});


module.exports = router;
