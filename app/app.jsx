'use strict';

var Party = require('./party')
  , moment = require('moment')
  , Empty = require('./empty')
  , Filters = require('./filters')
  , React = require('react/addons');

var Application = React.createClass({
  mixins: [React.addons.PureRenderMixin],

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
      var created = moment(new Date(row.created));

      created.local();
      created.subtract(8, 'hours');

      row.created = row.modified = created;

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
   * Render the UI
   *
   * @returns {React.DOM}
   * @api private
   */
  render: function render() {
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
