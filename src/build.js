// Static site build task

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
require('node-jsx').install();

var template = _.template(fs.readFileSync(path.join(__dirname, './layouts/default.html'), 'utf8'));
var App = React.createFactory(require('./components/app.jsx'));

var data = require('./data');
data.app = ReactDOMServer.renderToString(App(data));
var html = template(data);
fs.writeFileSync(path.join(__dirname, '../index.html'), html);

