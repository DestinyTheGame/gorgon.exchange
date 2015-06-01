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
    var className = [ this.props.platform.replace(' ', '-'), 'box' ];

    if (!this.props.fresh) className.push('old');

    return (
      <div className={className.join(' ')}>
        {this.props.title}
        <div title={this.props.created.calendar()}>
          {this.props.created.fromNow()}, username: <strong>{this.props.author}</strong>
        </div>
      </div>
    );
  }
});
