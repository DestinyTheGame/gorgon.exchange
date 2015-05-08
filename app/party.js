'use strict';

var React = require('react/addons');

/**
 * Render a gorgon party listing.
 *
 * @constructor
 * @api private
 */
module.exports = React.createClass({
  render: function render() {
    return (
      <div className={'box '+ this.props.platform.replace(' ', '-')}>
        <a href={this.props.url}>
          {this.props.title}
        </a>
      </div>
    );
  }
});
