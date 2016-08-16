/** @jsx React.DOM */

var React = require('react');
var qs = require('query-string');
var Q = require('q');

var notePosition = require('../util/note-position');

var bumpkit = require('../bumpkit');
var bap = require('../bap');
var pattern;
var slots = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'];
var bapKit;

var Toolbar = require('./toolbar.jsx');
var Sequencer = require('./sequencer.jsx');
var Footer = require('./footer.jsx');

module.exports = React.createClass({

  getInitialState: function() {
    return {
      isPlaying: false,
      tempo: 96,
      bars: 1,
      currentStep: 0,
      volume: 1,
      samples: [],
      clips: [],
      currentKit: 1,
      currentBank: 2,
      
    }
  },

  initClips: function() {
    var clips = [];
    for (var i = 0; i < 8; i++) {
      clips[i] = {};
      clips[i].pattern = [];
    }
    return clips;
  },

  randomizePatterns: function() {
    var clips = this.state.clips;
    for (var i = 0; i < 8; i++) {
      clips[i].pattern = [];
      for (var j = 0; j < 16; j++) {
        clips[i].pattern.push( Math.round(Math.random() * .625) );
      }
    }
    this.updateClips(clips);
  },

  loadBank: function(i) {
    var bank = this.props.banks[i];
    var clips = this.state.clips;
    bank.tracks.forEach(function(track, j) {
      clips[j].pattern = track.pattern;
    });
    this.updateClips(clips);
    var tempo = bank.tempo || false;
    if (tempo) {
      this.setTempo(tempo);
    }
    this.setState({ currentBank: i }, function() {
      this.updateUrlParams();
    });
  },

  loadSamples: function() {
    var self = this;
    var deferred = Q.defer();
    var kit = this.props.kits[this.state.currentKit];
    var kitSamples = kit.samples;
    var samples = this.state.samples;
    kitSamples.forEach(function(sample, i) {
      (function(index) {
        var url = self.props.audio_path + kit.path + '/' + sample;
        var bapSample = bap.sample(url);
          samples[index] = bapSample;
          samples[index].url = url;
      })(i);
    })
    self.setState({ samples: samples }, function() {
            deferred.resolve();
          });
    return deferred.promise;
  },

  loadSlots: function() {
    var self = this;
    console.log('in loadSlots');
    console.log('samples in loadSlots', self.state.samples);
    for(var i = 0; i < self.state.samples.length; i++){
      var slot = bap.slot();
      slot.layer(self.state.samples[i]);
      bapKit.slot(slots[i], slot);
    }
    console.log('pattern', pattern);
    console.log('bapKit', bapKit);
  },

  addStepListener: function() {//done
    if (!window) return false;
    var self = this;
    window.addEventListener('step', function(e) {
      var step = e.detail.step
      self.setState({ currentStep: step });
    });
  },

  playPause: function() {
    if (pattern.playing) {
      pattern.pause();
    }
    else{
      pattern.start();
    }
    this.setState({
      isPlaying: pattern.playing
    });
  },

  loadKit: function(i) {
    var self = this;
    this.setState({ currentKit: i }, function() {
      self.loadSamples().then(function() {
        self.loadSlots();
      });;
      self.updateUrlParams();
    });
  },

  handleTempoChange: function(e) {
    var self = this;
    var tempo = e.target.value;
    this.setTempo(tempo);
  },

  setTempo: function(n) {
    var self = this;
    pattern.tempo = parseInt(n);
    this.setState({ tempo: pattern.tempo }, function() {
      self.updateUrlParams();
    });
  },

  updateClips: function(clips) {
    this.setState({ clips: clips });
    this.updatePatternChannel(clips);
  },

  updatePatternChannel: function (clips) {
    var self = this;
    var chan = bap.channel();
    clips.forEach(function(clip, trackIndex){
      var notes = self.bitPatternToNotes(clip, trackIndex);
      notes.forEach(function(note){
        chan.add(note);
      });
    });
    pattern.channel(1, chan)
    console.log('channel', chan);
  },

  bitPatternToNotes: function (clip, trackIndex) {
    var self = this;
    var notes = [];
    var ticks = ['01', '26', '51', '76'];
    clip.pattern.forEach(function(bit, index){
      if(bit){
        notes.push(['1.' + notePosition(index) + '.' + ticks[index % 4], '1' + slots[trackIndex]]);
      }
    });
    console.log(notes);
    return notes;
  },

  initBap: function() {
    var self = this;
    if (!bap) { return false; }
    pattern = bap.pattern({ tempo: self.state.tempo, bars: self.state.bars });
    bapKit = bap.kit();
    pattern.kit(1, bapKit);
    this.setTempo(this.state.tempo);
    var clips = this.initClips();
    this.setState({
      clips: clips,
      isPlaying: pattern.playing
    }, function() {
      self.loadBank(self.state.currentBank);
      self.loadSamples().then(function() {
        console.log('samples', self.state.samples);
        self.loadSlots();
      });;
    });
    this.addStepListener();
  },

  updateUrlParams: function() {
    if (!window) { return false }
    var params = {
      tempo: this.state.tempo,
      currentKit: this.state.currentKit,
      currentBank: this.state.currentBank,
    };
    var query = '?' + qs.stringify(params);
    window.history.pushState(params, 'Stepkit', query);
  },

  componentDidMount: function() {
    var self = this;
    if (window) {
      var params = qs.parse(window.location.search);
      this.setState(params);
    }
    this.initBap();
    if (document) {
      document.onkeydown = function(e) {
        //console.log(e.which);
        switch (e.which) {
          case 32:
            e.preventDefault();
            self.playPause();
            break;
          default:
            break;
        }
      };
    }
  },

  render: function() {
    var containerStyle = {
      minHeight: '100vh'
    };
    return (
      <div className="flex flex-column"
        style={containerStyle}>
        <Toolbar {...this.props} {...this.state}
          playPause={this.playPause}
          handleTempoChange={this.handleTempoChange}
          loadBank={this.loadBank}
          loadKit={this.loadKit}
          randomize={this.randomizePatterns}
          />
        <Sequencer {...this.props} {...this.state}
          updateClips={this.updateClips}
          />
        <Footer {...this.props} />
      </div>
    )
  }

});