

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
    date: function(date) {
        var then = moment(date);
        if (then.isValid()) {
            return then.format('LL');
        } else {
            return date;
        }
    }
  }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

app.locals.title = "Example blog";
app.locals.author = {
    "name": "Jason Sadler",
    "twitter": {
        "username": "sadlerjw",
        "url": "https://twitter.com/sadlerjw"
    }
};
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
        error: {},
        title: 'error'
    });
});


module.exports = app;
