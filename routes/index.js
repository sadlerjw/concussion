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

	var pageSize = 1;


	/* GET home page. */
	router.get('/', function(req, res, next) {
		Article.findAll().then(function(articles){
			var page = 1;
			var pages = Math.ceil(articles.length / pageSize);
			if ('page' in req.query) {
				var queryPage = parseInt(req.query.page);
				if (queryPage !== NaN) {
					page = queryPage;
				}
			}
			var firstArticleIndex = (page - 1) * pageSize;
			var pagedArticles = [];
			if (firstArticleIndex < articles.length) {
				pagedArticles = articles.slice(firstArticleIndex, firstArticleIndex + pageSize);
			}
			if (pagedArticles.length > 0) {
				var context = {articles: pagedArticles};
				if (page < pages) {
					context.nextPage = page + 1;
				}
				if (page > 1) {
					context.previousPage = page - 1;
				}
				res.render('index', context);
			} else {
				next();
			}
		}).fail(function(error) {
			next();
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

	return router;
}
