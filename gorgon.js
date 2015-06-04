'use strict';

var async = require('async')
  , one = require('one-time')
  , moment = require('moment')
  , request = require('request')
  , Snoocore = require('snoocore')
  , EventEmitter = require('eventemitter3')
  , reddit = new Snoocore(require('./config'))
  , debug = require('diagnostics')('gorgon:exchange');

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
 * Exclude words that are included in posts that people use when they are
 * SEARCHING for the chest instead of actually hosting it.
 *
 * In addition to that, we can filter out *closed* parties through the body.
 *
 * @type {Object}
 * @private
 */
Gorgon.exclude = {
  title: ['lf', 'starting', 'l4', 'anyone', 'looking', 'would', 'anybody', 'lfg', 'lfm', 'crota', 'ether', 'farm', 'farming', 'ToO', 'need', 'chest plate', 'lookin for', ' share', 'request'],
  body: ['closed', 'edit: closed', 'edit:close', 'edit : close', '**closed**', '**close**', 'edit: that\'s all folks', 'edit: thats all folks', 'edit: done for tonight', 'edit: finished', 'edit: done', 'edit: no longer giving it away', 'edit: giveaway is closed', 'edit : done', 'hook me up with']
};

/**
 * The posts are required to included at least one of these words in order to be
 * considered suitable for this exchange.
 *
 * @type {Object}
 * @api private
 */
Gorgon.include = {
  title: ['chest', 'gorgon']
};

/**
 * Update information from various of endpoints.
 *
 * @param {Function} yay Completion callback.
 * @param {Function} nay Error callback.
 * @api private
 */
Gorgon.prototype.update = function update(yay, nay) {
  var gorgon = this;

  debug('updating our internal gorgon cache');

  async.reduce([
    'reddit',
    'destinylfg'
  ], [], function process(memo, service, next) {
    debug('attempting to receive information from %s', service);

    gorgon[service](function yay(rows) {
      Array.prototype.push.apply(memo, rows);
      next(undefined, memo);
    }, next);
  }, function completion(err, rows) {
    if (err) return nay(err);

    debug('received %d potential events', rows.length);

    //
    // Now that everything is sorted and normalized we want to make sure that we
    // remove out of date duplicate posts from authors. It's quite common that
    // authors will re-post their exchange in order to get more visibility on
    // boards. This unfortunately leads to UI clutter and confusing listings. In
    // order to fix this we're going to remove their oldest posts.
    //
    gorgon.data = rows.sort(function sort(a, b) {
      return b.created - a.created;
    }).filter(function filter(row, current, all) {
      for (var i = 0; i < current; i++) {
        if (all[i].author === row.author && row.source === all[i].source) {
          debug('removing `%s` as author `%s` made newer post', row.title, row.author);

          return false;
        }
      }

      return true;
    });

    yay(gorgon.data);
  });
};

/**
 * Search the destinylfg.com site for Gorgon chest giveaway.
 *
 * @param {Function} yay Completion callback.
 * @param {Function} nay Error callback.
 * @api private
 */
Gorgon.prototype.destinylfg = function destinylfg(yay, nay) {
  var gorgon = this;

  yay = one(yay);   // Prevent multiple executions.
  nay = one(nay);   // Prevent multiple executions.

  request({
    url: 'https://www.destinylfg.net/groups.json',
    method: 'GET',
    json: true
  }, function lfgd(err, res, rows) {
    if (err || !rows.length || !Array.isArray(rows)) {
      return nay(err || new Error('no fresh data received from lfg'));
    }

    rows = rows.filter(function filter(row) {
      var notes = (row.notes || '').toLowerCase().trim();

      if (!~row.event.indexOf('vaultofglass') || !notes.length) {
        return false;
      }

      if (!Gorgon.include.title.some(function some(word) {
        return ~notes.indexOf(word);
      })) return false;

      if (Gorgon.exclude.body.some(function some(word) {
        return ~notes.indexOf(word) || ~row.notes.indexOf(word);
      })) return false;

      if (Gorgon.exclude.title.some(function some(word) {
        return ~notes.indexOf(word) || ~row.notes.indexOf(word);
      })) return false;

      return true;
    }).map(function normalize(row) {
      return gorgon.normalize.destinylfg(row);
    });

    debug('received %d rows from destinylfg', rows.length);
    yay(rows);
  });
};

/**
 * Search the reddit fire teams subreddit for Gorgon chest giveaway.
 *
 * @param {Function} yay Completion callback.
 * @param {Function} nay Error callback.
 * @api private
 */
Gorgon.prototype.reddit = function redditapi(yay, nay) {
  var gorgon = this;

  yay = one(yay);   // Prevent multiple executions.
  nay = one(nay);   // Prevent multiple executions.

  reddit('/r/Fireteams/search').get({
    q: 'title:'+ Gorgon.include.title.join(' OR '),
    restrict_sr: 'on',        // Don't include an other subreddit.
    t: 'week',                // Only include up and until last week.
    sort: 'new',              // Make sure that newest arrive first.
    limit: 100                // Include, all the results.
  }).then(function get(result) {
    if (!result || !result.data || !result.data.children) {
      return nay(new Error('no fresh data received from reddit'));
    }

    var rows = result.data.children.map(function cleanup(row) {
      return row.data;
    })
    .filter(function filter(row) {
      var title = row.title.toLowerCase()
        , body = row.selftext.toLowerCase();

      if (Gorgon.exclude.body.some(function some(word) {
        return ~body.indexOf(word) || ~row.selftext.indexOf(word);
      })) return false;

      if (Gorgon.exclude.title.some(function some(word) {
        return ~title.indexOf(word) || ~row.title.indexOf(word);
      })) return false;

      return true;
    }).map(function normalize(row) {
      return gorgon.normalize.reddit(row);
    });

    debug('received %d rows from reddit', rows.length);
    yay(rows);
  }).catch(nay);
};

/**
 * Result normalization so we all share the same data structure.
 *
 * @type {Object}
 * @api private
 */
Gorgon.prototype.normalize = {
  /**
   * Normalize the returned data to a clean and useful structure.
   *
   * @param {Object} row The received row from the Reddit server.
   * @returns {Object} Brand spanking new, clean object.
   * @api private
   */
  reddit: function normalize(row) {
    var created = moment(row.created, 'X')
      , now = moment();

    created.local();
    created.subtract(8, 'hours');

    return {
      title: row.title.replace(/^\[[^\]]+?\]/, '').trim(),
      fresh: now.diff(created, 'hours') <= 4,
      platform: this.platform(row.link_flair_text),
      author: row.author,
      created: +created,
      source: 'reddit',
      _id: row.id,
      url: row.url
    };
  },

  /**
   * Normalize the returned data to a clean and useful structure.
   *
   * @param {Object} row The received row from the Reddit server.
   * @returns {Object} Brand spanking new, clean object.
   * @api private
   */
  destinylfg: function normalize(row) {
    return {
      title: row.notes,
      fresh: true,
      platform: this.platform(row.platform),
      author: row.gamertag,
      created: row.time,
      source: 'destinylfg',
      _id: row.id,
      url: row.link
    };
  },

  /**
   * Attempt to normalize platforms between all supported services.
   *
   * @param {String} name Platform name.
   * @returns {String} platform name
   * @api private
   */
  platform: function platform(name) {
    switch (name) {
      case 'xbox1':
      return 'Xbox-One';

      case 'ps3':
      return 'PS3';

      case 'ps4':
      return 'PS4';

      case 'xbox360':
      return 'Xbox-360';
    }

    return name;
  }
};

//
// Expose the module.
//
module.exports = Gorgon;
