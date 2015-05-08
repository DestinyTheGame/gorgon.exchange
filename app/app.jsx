'use strict';

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
      gee: JSON.parse(document.getElementById('gee').innerHTML)
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
      app.setState({ gee: rows });
    });
  },

  /**
   * Kill the primus update as we're no longer attached to the DOM.
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
      <ul>
      {this.state.gee.map(function (row) {
        return (
          <li>
            <a href={row.url}>
            <strong>[{row.platform}] {row.title}</strong>
            </a>
          </li>
        )
      })}
      </ul>
    );
  }
});

//
// Render the applicaiton now that all the things are donw.
//
React.render(<Application />, document.getElementById('app'));
