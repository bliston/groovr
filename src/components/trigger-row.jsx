/** @jsx React.DOM */

var React = require('react');

var stepFilter = require('../util/step-filter');
var Trigger = require('./trigger.jsx');

module.exports = React.createClass({

  renderTrigger: function(step, i) {
    var self = this;
    var active = (step > 0);
    var clip = this.props.clip;
    var updateClip = function(value) {
      clip.pattern[i] = value;
      self.props.updateClip(clip);
    };
    var beat = stepFilter(i + 1);
    var current = (this.props.currentStep == i);
    var cellClass = 'flex-auto flex px1 py1 ';
    //cellClass += i%4 ? '' : 'bg-darken-2';
    cellClass += (!active && i%4) ? 'muted' : '';
    var triggerKey = 'trigger-' + i;
    return (
      <div key={triggerKey} className={cellClass}>
        <Trigger
          {...this.props}
          active={active}
          current={current}
          step={i}
          updateClip={updateClip} />
      </div>
    )
  },

  render: function() {
    var clip = this.props.clip;
    var key = 'row-' + this.props.track;
    return (
      <div key={key} className="flex flex-center mxn1 ">
        {clip.pattern.map(this.renderTrigger)}
      </div>
    )
  },

});

