'use strict';

var debug = require('diagnostics')('gorgon:web')
  , assign = require('object-assign')
  , config = require('./config')
  , Gorgon = require('./gorgon')
  , express = require('express')
  , Primus = require('primus')
  , http = require('http');

//
// Setup the HTTP server.
//
var app = express()
  , server = http.createServer(app);

app.set('views', './app');
app.set('view engine', 'ejs');
app.use(require('serve-static')('app'));
app.use(require('serve-static')('dist'));

/**
 * Handle in the incoming API requests.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP request.
 * @api private
 */
app.get('/gee', function api(req, res) {
  res.set('Content-Type', 'application/json');
  res.status(200).send(gee.data);
});

/**
 * Parse the `:flair` param to a regular lowercase string.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP request.
 * @param {Function} next Completion callback.
 * @param {String} flair The param contents.
 * @api private
 */
app.param('flair', function (req, res, next, flair) {
  req.params.flair = flair.toLowerCase().trim();
  next();
});

/**
 * Handle in the incoming API requests but with platform filtering
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP request.
 * @api private
 */
app.get('/gee/:flair', function api(req, res) {
  res.set('Content-Type', 'application/json');

  res.status(200).send(gee.data.filter(function filter(row) {
    return (row.platform || '').toLowerCase() === req.params.flair;
  }));
});

/**
 * Handle requests to the index.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP request.
 * @api private
 */
app.get('/', function index(req, res) {
  if (!gee.data.length) return gee.once('data', function defer() {
    index(req, res);
  });

  res.render('index', assign({
    env: process.env.NODE_ENV === 'production' ? 'min' : 'dev',
    gee: gee.data
  }, config));
});

/**
 * Handle requests to the about page.
 *
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP request.
 * @api private
 */
app.get('/about', function index(req, res) {
  res.render('about', assign({
    env: process.env.NODE_ENV === 'production' ? 'min' : 'dev'
  }, config));
});

//
// Setup Primus for all real-time interactions.
//
var primus = new Primus(server, {
  plugin: {
    emit: require('primus-emit')
  },
  transformer: 'websockets'
});

//
// Setup our Gorgon Exchange Emitter.
//
var gee = new Gorgon(config.interval);

//
// Make sure we broadcast the new gee list to all subscribers so they can update
// their internal state.
//
gee.on('data', function update(data) {
  debug('broadcasting to %d connected users', primus.connected);

  primus.forEach(function each(spark) {
    spark.emit('gee', data);
  });
});

//
// Listen to the server and do all the things with things.
//
require('connected')(server, config.port, function connected(err) {
  if (err) throw err;

  console.log('server listening on: http://localhost:8080');
});
