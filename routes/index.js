var express = require('express');
var hljs = require('highlight.js');
var moment = require('moment');
var qfs = require('q-io/fs');
var Q = require('q');
var Article = require('../article.js');

var router = express.Router();


/* GET home page. */

router.get('/', function(req, res) {
  res.render('index', { articles: getArticlesForIndex(req.app) });
});

router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/(\S+)$/, function(req, res, next) {
	var year = req.params[0];
	var month = req.params[1];
	var day = req.params[2];
	var name = req.params[3];
	
	var date = moment([year, month, day]);

	findArticle('/' + year + '/' + month + '/' + day + '/' + name, req.app).then(function(article) {
		if (article) {
			res.render('article', { article: article })
		} else {
			next();
		}
	}).fail(function(error) {
		next();
	});
});

function findArticle(path, app) {
	var article = undefined;
	if (app.locals.articleCache == undefined) {
		app.locals.articleCache = {};
	}

	article = app.locals.articleCache[path];
	
	if (article == undefined) {
		var fullPath = qfs.join(app.locals.postDirectory, './' + path + '.md')
		return qfs.read(fullPath)
			.then(function(markdown) {
				var article = new Article(markdown, path);
				app.locals.articleCache[path] = article;
				return article;
			});
	}
	return Q(article);
}

function getArticlesForIndex(app) {
	return {
		"/2014/08/22/mocked-post-1": {
			title: "Mocked Post #1",
			subtitle: "The first post to show",
			date: "2014/08/22",
			url: "/2014/08/22/mocked-post-1",
			content: "<p>Mauris maximus interdum fermentum. In sollicitudin, ligula a scelerisque interdum, neque purus elementum nibh, nec ultricies sapien lectus eu turpis. Sed vestibulum velit at nibh mattis varius. Donec sit amet accumsan arcu. Sed vel varius neque. Aliquam id fringilla tortor. Cras dapibus consectetur quam vel varius. Donec tempus ante quam, ac tincidunt ipsum commodo id.</p><p>Cras eu elit facilisis, cursus nulla quis, vulputate purus. Nullam porttitor luctus neque eu blandit. Quisque id sagittis magna. Aliquam faucibus quam non mattis interdum. Suspendisse sed lectus sem. Mauris consequat lobortis felis ut dictum. Vivamus eu ultricies lorem. Mauris gravida ligula sed purus fringilla cursus. Cras tincidunt, orci sit amet vehicula posuere, nisi ligula vestibulum dui, quis vestibulum magna nibh ut urna.</p>"
		},
		"/2014/01/01/another-mocked-post": {
			title: "Another Mocked Post",
			date: "2014/01/01",
			url: "/2014/01/01/another-mocked-post",
			content: "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent mattis erat bibendum sem viverra, et fermentum lorem vehicula. Pellentesque vestibulum, augue at auctor feugiat, nisi leo gravida sem, eu lobortis risus mauris non mauris. Morbi lectus nisl, scelerisque a ultrices et, tempor sagittis diam. Quisque ac sapien lobortis, sagittis lacus nec, suscipit quam. Sed elit odio, aliquam vitae egestas ut, scelerisque faucibus urna. Nunc rutrum accumsan augue. Nam rutrum consectetur tellus eget pulvinar. Quisque ex magna, ultrices ac lacinia eu, tempus a nisi. Nunc auctor a mauris quis lacinia. Fusce eget augue massa.</p>"
		}
	};
}

module.exports = router;
