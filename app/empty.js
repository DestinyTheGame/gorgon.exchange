'use strict';

var React = require('react');

/**
 * Render a helpful message.
 *
 * @constructor
 * @api private
 */
module.exports = React.createClass({
  render: function render() {
    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <h4>Oh noes!</h4>

          It there are no active Gorgon chest giveaways! Either adjust your
          filters that you might have selected above or just wait around. This
          page will automatically update while we attempt to find more
          giveaway's.
        </div>
      </div>
    );
  }
});
