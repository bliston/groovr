// App

var React = require('react');
var ReactDOM = require('react-dom');
var data = require('./data');

var App = React.createFactory(require('./components/bapp.jsx'));

ReactDOM.render(
  App(data),
  document.getElementById('app')
);


