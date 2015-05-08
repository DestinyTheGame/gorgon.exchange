'use strict';

var Application = React.createClass({
  mixins: [React.addons.PureRenderMixin],

  getInitialState: function getInitialState() {
    return {
      gee: JSON.parse(document.getElementById('gee').innerHTML)
    };
  },
  componentDidMount: function componentDidMount() {
    var primus = this.primus = new Primus()
      , app = this;

    primus.on('gee', function gee(rows) {
      app.setState({ gee: rows });
    });
  },
  componentWillUnmount: function componentWillUnmount() {
    if (!this.primus) return;

    this.primus.end();
    this.primus = null;
  },

  render: function render() {
    return (
      <ul>
      {this.state.gee.map(function (row) {
        return (
          <li>
            <a href={'https://reddit.com'+ row.permalink}>
            <strong>{row.title}</strong>
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
