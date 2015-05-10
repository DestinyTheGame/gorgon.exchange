'use strict';

var Material = require('material-ui')
  , React = require('react/addons')
  , Party = require('./party');

//
// Material
//
var Tabs = Material.Tabs
  , Tab = Material.Tab;

module.exports = React.createClass({
  render: function render() {
    return (
      <Tabs>
        <Tab label="Playstation 4">
          hi
        </Tab>
        <Tab label="Playstation 3">
          what
        </Tab>
        <Tab label="Xbox One">
          foo
        </Tab>
        <Tab label="Xbox 360">
          bar
        </Tab>
      </Tabs>
    );
  }
});
