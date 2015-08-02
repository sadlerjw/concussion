

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var exphbs  = require('express-handlebars');
var moment = require('moment');

var app = express();

// view engine setup

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: ['views/partials/'],
  helpers: {
    formatDate: function(date) {
        var then = moment(date);
        if (then.isValid()) {
            return then.format('LL');
        } else {
            return date;
        }
    },
    greater: function(a, b) {
        return a > b;
    }
  }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

app.locals.author = {"name": process.env.BLOG_AUTHOR_NAME || "Unknown"};
app.locals.title = process.env.BLOG_TITLE || (app.locals.author.name + "'s Blog");
app.locals.description = process.env.BLOG_DESCRIPTION || "";

if (process.env.BLOG_AUTHOR_TWITTER) {
    app.locals.author.twitter = {
        "username": process.env.BLOG_AUTHOR_TWITTER,
        "url": "https://twitter.com/" + process.env.BLOG_AUTHOR_TWITTER
    };
}
if (process.env.BLOG_AUTHOR_LINKEDIN) {
    app.locals.author.linkedin = {
        "url": process.env.BLOG_AUTHOR_LINKEDIN
    };
}

app.locals.postDirectory = path.join(__dirname, 'posts/');


// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes/index')(app);
app.use('/', routes);

app.use(express.static(path.join(__dirname, 'posts')));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            status: err.status,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        status: err.status,
        error: null,
        title: 'error'
    });
});


module.exports = app;
