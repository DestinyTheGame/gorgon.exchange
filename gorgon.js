'use strict';

var one = require('one-time')
  , moment = require('moment')
  , Snoocore = require('snoocore')
  , EventEmitter = require('eventemitter3')
  , reddit = new Snoocore(require('./config'));

/**
 * Gorgon Exchange Emitter (GEE).
 *
 * @constructor
 * @param {Number} interval The interval
 * @api private
 */
function Gorgon(interval) {
  this.interval = interval;
  this.timer = null;
  this.data = [];

  this.initialize();
}

Gorgon.prototype = new EventEmitter();
Gorgon.prototype.constructor = Gorgon;
Gorgon.prototype.emits = require('emits');

/**
 * Initialize the Gorgon Exchange
 *
 * @api private
 */
Gorgon.prototype.initialize = function initialize() {
  var gorgon = this;

  gorgon.update(gorgon.emits('data'), gorgon.emits('error'));

  //
  // Go for incremental updates to ensure that all the things stay fresh and up
  // to date.
  //
  gorgon.timer = setInterval(function interval() {
    gorgon.update(gorgon.emits('data'), gorgon.emits('error'));
  }, gorgon.interval);
};

/**
 * Destroy the Gorgon instance.
 *
 * @returns {Boolean} Successful destruction.
 * @api public
 */
Gorgon.prototype.destroy = function destroy() {
  if (!this.timer) return false;

  clearInterval(this.timer);
  this.data.length = 0;

  return true;
};

/**
 *
 * Exclude words that are included in posts that people use when they are
 * SEARCHING for the chest instead of actually hosting it.
 *
 * In addition to that, we can filter out *closed* parties through the body.
 *
 * @type {Object}
 * @private
 */
Gorgon.exclude = {
  title: ['lf', 'starting', 'l4', 'anyone', 'looking', 'would', 'have', 'anybody', 'lfg', 'lfm', 'crota', 'ether', 'farm', 'farming', 'ToO', 'need'],
  body: ['closed', 'edit: closed', 'edit:close', 'edit : close', '**closed**', '**close**', 'edit: that\'s all folks', 'edit: thats all folks', 'edit: done for tonight', 'edit: finished']
};

/**
 * Search the reddit fire teams subreddit for Gorgon chest giveaway.
 *
 * @param {Function} yay Completion callback.
 * @param {Function} nay Error callback.
 * @api private
 */
Gorgon.prototype.update = function update(yay, nay) {
  var gorgon = this;

  yay = one(yay);   // Prevent multiple executions.
  nay = one(nay);   // Prevent multiple executions.

  reddit('/r/Fireteams/search').get({
    q: ['title:chest OR gorgon'].concat(Gorgon.exclude.title.map(function filter(word) {
      return 'title:-'+ word;
    })).join(' '),
    restrict_sr: 'on',        // Don't include an other subreddit.
    t: 'week',                // Only include up and until last week.
    sort: 'new',              // Make sure that newest arrive first.
    limit: 100                // Include, all the results.
  }).then(function get(result) {
    if (!result || !result.data || !result.data.children) {
      return nay(new Error('no fresh data received'));
    }

    var rows = result.data.children.map(function cleanup(row) {
      return row.data;
    })
    .filter(function filter(row) {
      var title = row.title.toLowerCase()
        , body = row.selftext.toLowerCase();

      if (Gorgon.exclude.body.some(function some(word) {
        return ~body.indexOf(word);
      })) return false;

      return true;
    }).map(function normalize(row) {
      return gorgon.normalize(row);
    });

    //
    // Update our internal state and call all the callbacks.
    //
    gorgon.data = rows;
    yay(rows);

    console.log('updating with %d rows', rows.length);
  }).catch(nay);
};

/**
 * Normalize the returned data to a clean and useful structure.
 *
 * @param {Object} row The received row from the Reddit server.
 * @returns {Object} Brand spanking new, clean object.
 * @api private
 */
Gorgon.prototype.normalize = function normalize(row) {
  var created = moment(row.created, 'X')
    , mod = moment(row.edited, 'X')
    , now = moment();

  return {
    title: row.title.replace(/^\[[^\]]+?\]/, '').trim(),
    fresh: now.diff(created, 'hours') <= 2,
    platform: row.link_flair_text,
    author: row.author,
    text: row.selftext,
    created: +created,
    score: row.score,
    modified: +mod,
    _id: row.id,
    url: row.url
  };
};

//
// Expose the module.
//
module.exports = Gorgon;
