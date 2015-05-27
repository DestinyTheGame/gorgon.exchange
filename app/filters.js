'use strict';

var React = require('react');

/**
 * Filter bar.
 *
 * @constructor
 * @api private
 */
module.exports = React.createClass({
  /**
   * Initiate filtering.
   *
   * @param {Event} evt Click event
   * @api private
   */
  filter: function filter(evt) {
    evt.preventDefault();

    if (this.props.filter) {
      this.props.filter(evt.target.name);
    }
  },

  /**
   * Render the button bar.
   *
   * @api private
   */
  render: function render() {
    return (
      <form className="filter">
        <h2>Filter on platform</h2>

        <div className="btn-group" role="group">
          <button className="btn btn-default PS4" name="PS4" onClick={this.filter}>
            PS4
          </button>
          <button className="btn btn-default PS3" name="PS3" onClick={this.filter}>
            PS3
          </button>
          <button className="btn btn-default XB1" name="Xbox One" onClick={this.filter}>
            XB1
          </button>
          <button className="btn btn-default XB360" name="Xbox 360" onClick={this.filter}>
            360
          </button>
          <button className="btn btn-default" name="all" onClick={this.filter}>
            All platforms
          </button>
        </div>
      </form>
    );
  }
});
