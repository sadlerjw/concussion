var express = require('express');
var hljs = require('highlight.js');
var moment = require('moment');
var LRU = require('lru-cache');

module.exports = function(app) {

	if (app.locals.articlesByURL == undefined) {
		app.locals.articlesByURL = LRU({
			max: 20000,	// ~20MB based only on string size
			length: function(article) {
				return Math.max((article.markdown || '').length, (article.content || '').length);
			}
		});
	}
	if (app.locals.allArticles == undefined) {
		app.locals.allArticles = LRU({
			max: 1,
			maxAge: 900000	// 15 minutes
		});
	}

	var Article = require('../article.js')(app.locals.postDirectory, app.locals.articlesByURL, app.locals.allArticles);

	var router = express.Router();

	/* GET home page. */
	router.get('/', function(req, res) {
		Article.findAll().then(function(articles){
			res.render('index', { articles: articles });
		});
	});

	// Anything without a '.' in the name. Articles should never have dots in the path.
	router.get(/^[^\.]*$/, function(req, res, next) {
		Article.find(req.path).then(function(article) {
			if (article) {
				res.render('article', { article: article })
			} else {
				next();
			}
		}).fail(function(error) {
			next();
		});
	});

	function getArticlesForIndex(app) {
		return {
			"/2014/08/22/mocked-post-1": {
				title: "Mocked Post #1",
				subtitle: "The first post to show",
				date: "2014/08/22",
				path: "/2014/08/22/mocked-post-1",
				content: "<p>Mauris maximus interdum fermentum. In sollicitudin, ligula a scelerisque interdum, neque purus elementum nibh, nec ultricies sapien lectus eu turpis. Sed vestibulum velit at nibh mattis varius. Donec sit amet accumsan arcu. Sed vel varius neque. Aliquam id fringilla tortor. Cras dapibus consectetur quam vel varius. Donec tempus ante quam, ac tincidunt ipsum commodo id.</p><p>Cras eu elit facilisis, cursus nulla quis, vulputate purus. Nullam porttitor luctus neque eu blandit. Quisque id sagittis magna. Aliquam faucibus quam non mattis interdum. Suspendisse sed lectus sem. Mauris consequat lobortis felis ut dictum. Vivamus eu ultricies lorem. Mauris gravida ligula sed purus fringilla cursus. Cras tincidunt, orci sit amet vehicula posuere, nisi ligula vestibulum dui, quis vestibulum magna nibh ut urna.</p>"
			},
			"/2014/01/01/another-mocked-post": {
				title: "Another Mocked Post",
				date: "2014/01/01",
				path: "/2014/01/01/another-mocked-post",
				content: "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent mattis erat bibendum sem viverra, et fermentum lorem vehicula. Pellentesque vestibulum, augue at auctor feugiat, nisi leo gravida sem, eu lobortis risus mauris non mauris. Morbi lectus nisl, scelerisque a ultrices et, tempor sagittis diam. Quisque ac sapien lobortis, sagittis lacus nec, suscipit quam. Sed elit odio, aliquam vitae egestas ut, scelerisque faucibus urna. Nunc rutrum accumsan augue. Nam rutrum consectetur tellus eget pulvinar. Quisque ex magna, ultrices ac lacinia eu, tempus a nisi. Nunc auctor a mauris quis lacinia. Fusce eget augue massa.</p>"
			}
		};
	}

	return router;
}
