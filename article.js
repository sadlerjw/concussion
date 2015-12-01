var md = require('markdown-it')();

function Article(markdown, url) {
	this.markdown = markdown || '';
	this.url = url || '';

	var lines = markdown.split('\n');
	this.title = lines[0];

	var markdownRemainder;
	if (lines[1].match(/^\s*=+\s*$/m)) {
		markdownRemainder = lines.slice(2);
	} else {
		var markdownRemainder = lines.slice(1);
	}
	this.content = md.render(markdownRemainder.join('\n'));
}

module.exports = Article;
