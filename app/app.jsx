'use strict';

var Party = require('./party')
  , moment = require('moment')
  , Empty = require('./empty')
  , Notify = require('notifyjs')
  , Filters = require('./filters')
  , React = require('react/addons');

var Application = React.createClass({
  mixins: [React.addons.PureRenderMixin],

  /**
   * A simple check to see if we're allowed to send desktop notifications.
   * 
   * @type {Boolean}
   * @api private
   */
  asked: !Notify.needsPermission,

  /**
   * Extract the initial state from the JSON dump that is in the index page.
   *
   * @returns {Object} state
   * @api private
   */
  getInitialState: function getInitialState() {
    return {
      gee: this.parse(JSON.parse(document.getElementById('gee').innerHTML)),
      platform: 'all'
    };
  },

  /**
   * The component is added to the DOM we should start fetching data.
   *
   * @api private
   */
  componentDidMount: function componentDidMount() {
    var primus = this.primus = new Primus()
      , app = this;

    primus.on('gee', function gee(rows) {
      app.setState({ gee: app.parse(rows) });
    });
  },

  /**
   * Parse the returned results so we can get proper JS properties.
   *
   * @param {Array} gee Exchange Data
   * @returns {Array}
   * @api private
   */
  parse: function parse(gee) {
    return gee.map(function map(row) {
      row.created = moment(new Date(row.created));

      return row;
    });
  },

  /**
   * Apply a filter on the dataset.
   *
   * @param {String} platform name of the platform we should filter upon.
   * @api private
   */
  filter: function filter(platform) {
    this.setState({ platform: platform || 'all' });
  },

  /**
   * Kill the Primus update as we're no longer attached to the DOM.
   *
   * @api private
   */
  componentWillUnmount: function componentWillUnmount() {
    if (!this.primus) return;

    this.primus.end();
    this.primus = null;
  },

  /**
   * Figure out if we should trigger a notification in the browser because we've
   * received a new update.
   *
   * @param {Object} props Properties that are getting updated.
   * @param {Object} state New state that is getting updated.
   * @api private
   */
  componentWillUpdate: function componentWillUpdate(props, state) {
    if (!state || !state.gee || !state.gee.length || !this.state.gee || !this.asked) return;

    var first = state.gee[0]
      , notification
      , matches;
    
    //
    // This is a really naive implementation as it assumes that new events will
    // be added as first item in the new state. And that it's given id is not in
    // the current set of data.
    //
    if (this.state.gee.some(function some(row) {
      return row._id === first._id;
    })) return;

    notification = new Notify('New Gorgon exchange for '+ first.platform, {
      body: first.title,
      timeout: 5
    });

    notification.show();
  },

  /**
   * Ask for permissions to display notifications.
   *
   * @api private
   */
  ask: function ask() {
    this.asked = true;
    Notify.requestPermission();
  },

  /**
   * Render the UI
   *
   * @returns {React.DOM}
   * @api private
   */
  render: function render() {
    if (!this.asked) this.ask();

    var rows = this.state.gee.filter(function filter(row) {
      if (this.state.platform === 'all') return true;

      return row.platform === this.state.platform;
    }, this).map(function map(row) {
      return <Party {...row} />
    });

    var view = rows.length ? rows : <Empty />;

    return (
      <div className="gorgon">
        <Filters filter={this.filter} />

        {view}
      </div>
    );
  }
});

//
// Render the application now that all the things are down.
//
React.render(<Application />, document.getElementById('app'));
