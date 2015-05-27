'use strict';

var Party = require('./party')
  , moment = require('moment')
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
      gee: this.parse(JSON.parse(document.getElementById('gee').innerHTML))
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
    return (
      <div className="gorgon">
      {this.state.gee.map(function map(row) {
        return <Party {...row} />
      })}
      </div>
    );
  }
});

//
// Render the applicaiton now that all the things are donw.
//
React.render(<Application />, document.getElementById('app'));
