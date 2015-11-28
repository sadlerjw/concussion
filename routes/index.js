var express = require('express');
var hljs = require('highlight.js');
var moment = require('moment');
var RSS = require('rss');

module.exports = function(app) {

	if (!('caches' in app.locals)) {
		app.locals.caches = {};
	}

	var Article = require('../article.js')(app.locals.postDirectory, app.locals.caches);

	var router = express.Router();

	var pageSize = 5;
	var itemsForRSS = 15;


	/* GET home page. */
	router.get('/', function(req, res, next) {
		Article.findAll(false).then(function(articles){
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
					context.pagination = true;
				}
				if (page > 1) {
					context.previousPage = page - 1;
					context.pagination = true;
				}
				res.render('index', context);
			} else {
				next();
			}
		}).fail(function(error) {
			console.log(error);
			next();
		});
	});

	router.get('/rss.xml', function(req, res, next) {
		var feed = new RSS({
			title: req.app.locals.title,
			description: req.app.locals.description,
			feed_url: urlForPath(req, '/rss.xml'),
			site_url: urlForPath(req, '/')
		});
		Article.findAll(false).then(function(articles) {
			articles.slice(0, itemsForRSS).forEach(function(article) {
				feed.item({
					title: article.title,
					description: article.content,
					url: urlForPath(req, article.path),
					date: article.date.toISOString(),
					author: req.app.locals.author.name
				});
			})
			res.send(feed.xml({indent:true}));
		}).fail(function(error){ 
			console.log(error);
			next();
		})
	});

	router.get('/archive', function(req, res, next) {
		Article.findAll(true).then(function(articles) {
			var articlesByYear = {};
			var undatedArticles = [];
			var years = [];

			articles.forEach(function(article) {
				var group;
				if (article.date !== null) {
					group = JSON.stringify(article.date.year());
				}
				if (group == null) {
					undatedArticles.push(article);
				} else {
					if (years.indexOf(group) == -1) {
						years.push(group);
						articlesByYear[group] = { year: group, articles: []};
					}					
					articlesByYear[group].articles.push(article);
				}
			});

			var archive = [];

			years.forEach(function(year) {
				archive.push(articlesByYear[year]);
			})

			if (undatedArticles.length > 0) {
				undatedArticles.sort(function(a, b) {
					return a.title.localeCompare(b.title);
				})
				archive.push({year: "Undated", articles: undatedArticles});
			}			

			res.render('archive', { archive: archive })
		}).fail(function(error){ 
			console.log(error);
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
			console.log(error);
			next();
		});
	});

	function urlForPath(req, path) {
		return req.protocol + "://" + req.hostname + path;
	}

	return router;
}
