var md = require('markdown-it')({html: true});
var hljs = require('markdown-it-highlightjs');
var qfs = require('q-io/fs');
var Q = require('q');
var moment = require('moment');
var yaml = require('js-yaml');

md.use(hljs);

module.exports = function(postDirectory, caches) {

	if (!('articlesByPath' in caches)) {
		caches.articlesByPath = {};
	}
	if (!('listings' in caches)) {
		caches.listings = {};
	}

	function Article(path, metadata, renderedText) {
		if (path == null) {
			throw new Error('Won\'t display article at ' + path + ' (no path)');
		}
		if (metadata == null) {
			throw new Error('Won\'t display article at ' + path + ' (metadata is missing)');
		}
		if (renderedText == null) {
			throw new Error('Won\'t display article at ' + path + ' (no rendered content)');
		}

		if ('published' in metadata && metadata.published !== true) {
			throw new Error('Won\'t display article at ' + path + ' (marked unpublished)');
		}
		if ('date' in metadata) {
			metadata.date = moment(new Date(metadata.date));
			if (!metadata.date.isValid()) {
				throw new Error('Won\'t display article at ' + path + ' (date is invalid)');
			}
		}

		if (!('title' in metadata) || metadata.title == null || metadata.title.length == 0) {
			throw new Error('Won\'t display article at ' + path + ' (no title)');
		}

		this.content = renderedText || '';
		this.path = path || '';
		this.date = metadata.date ? moment(new Date(metadata.date)) : null;
		this.title = metadata.title || '';
		this.metadata = metadata;
	}

	Article.find = function(path) {
		if (path in caches.articlesByPath) {
			console.log('Cache hit: ' + path);
			return caches.articlesByPath[path];
		}

		var promise = getFileContents(path)
			.then(function(fileContents) {
				var article = new Article(path, getMetadata(fileContents), getRenderedArticleText(fileContents));
				return article;
			});

		console.log('Cache miss: ' + path);
		caches.articlesByPath[path] = promise;
		return promise;
	}

	Article.findAll = function(includeNonFeedableArticles) {
		var cacheKey = includeNonFeedableArticles ? 'allArticles' : 'feedableArticles';
		if (cacheKey in caches.listings) {
			console.log('Cache hit:  ' + cacheKey);
			return caches.listings[cacheKey];
		}

		console.log('Cache miss: ' + cacheKey);

		var articlesPromise = qfs.listTree(postDirectory, function(filePath) {
			if (!includeNonFeedableArticles) {
				return filePath.match(/\/?\d{4}\/\d{2}\/\d{2}\/[^\/\\\s]+\.md$/) !== null;
			} else {
				return filePath.match(/.+\.md$/) !== null;
			}
		}).then(function(absolutePaths) {
			return Q.all(absolutePaths.map(function(absolutePath) {
				return qfs.relative(postDirectory, absolutePath);
			}));
		}).then(function(relativePaths) {
			var articlePromises = relativePaths.map(function(relativePath) {
				// Prepend / and remove extension
				relativePath = '/' + relativePath.slice(0, -(qfs.extension(relativePath).length));

				// Includes loading contents and rendering markdown
				return Article.find(relativePath);
			});
			return Q.allSettled(articlePromises);
		}).then(function(articlePromises) {
			var articles = []
			articlePromises.forEach(function(articlesPromise) {
				if (articlesPromise.state === "fulfilled") {
					var article = articlesPromise.value;
					articles.push(article);
				} else {
					console.log(articlesPromise.reason);
				}
			});
			return articles.sort(function(a, b) {
				if (a.date === null) {
					return b;
				} else if (b.date === null) {
					return a;
				}
				return b.date.unix() - a.date.unix();
			});
		});

		caches.listings[cacheKey] = articlesPromise;

		return articlesPromise;
	}

	function fullFilePathFromURLPath(path) {
		return qfs.join(postDirectory, './' + path + '.md');
	}

	function getFileContents(path) {
		var fullPath = fullFilePathFromURLPath(path);
		return qfs.read(fullPath)
	}

	function parseFileContents(fileContents) {
		var results = fileContents.match(/^---\n((?:.|\n)*?)---\n\s*((?:.|\n)*)$/)
		if (results.length > 2) {
			var metadata = results[1];
			var markdown = results[2];
			return {metadata: metadata, markdown: markdown};
		}
		return null;
	}

	function getMetadata(fileContents) {
		var parsed = parseFileContents(fileContents) || {};
		var yamlString = parsed.metadata;
		if (yamlString != null) {
			var metadata = yaml.safeLoad(yamlString);
			return metadata;
		}
		return null;
	}

	function getRenderedArticleText(fileContents) {
		var parsed = parseFileContents(fileContents) || {};
		var markdown = parsed.markdown;
		return md.render(markdown);
	}

	return Article;
}
