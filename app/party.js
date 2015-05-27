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
    var className = [
      this.props.platform.replace(' ', '-'),
      'box'
    ];

    if (!this.props.fresh) className.push('old');

    return (
      <div className={className.join(' ')}>
        <a href={this.props.url} target="_blank">
          {this.props.title}
        </a>
        <div title={this.props.created.calendar()}>
          {this.props.created.fromNow()}
        </div>
      </div>
    );
  }
});
