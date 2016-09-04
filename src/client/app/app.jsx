import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import _ from 'lodash'
import qs from 'query-string'
import Q from 'q'

import notePosition from '../../util/note-position'

import bap from 'bap'
let pattern
let slots = [ 'Q', 'W', 'E', 'R', 'T', 'Y', 
              'U', 'I', 'O', 'P', 'A', 'S', 
              'D', 'F', 'G', 'H', 'J', 'K', 
              'L', 'Z', 'X', 'C', 'V', 'B', 
              'N', 'M' ]
let bapKit

import Toolbar from './toolbar.jsx'
import Sequencer from './sequencer.jsx'
import Footer from './footer.jsx'

class App extends Component {

  constructor(props) {
      super(props)
      this.state = {
      isPlaying: false,
      tempo: 96,
      bars: 1,
      currentStep: 0,
      volume: 1,
      samples: [],
      clips: [],
      currentKit: 0,
      currentBank: 0,
    }
  }

initClips(){
    let clips = []
    for (let i = 0; i < 128; i++) {
      clips[i] = {}
      clips[i].pattern = []
    }
    return clips
  }

  loadBank(i) {
    let bank = this.props.banks[i]
    let clips = this.state.clips
    bank.tracks.forEach(function(track, j) {
      clips[j].pattern = track.pattern
    })
    this.updateClips(clips)
    let tempo = bank.tempo || false
    if (tempo) {
      this.setTempo(tempo)
    }
    this.setState({ currentBank: i }, function() {
      this.updateUrlParams()
    })
  }

  loadSamples() {
    let self = this
    let deferred = Q.defer()
    let kit = this.props.kits[this.state.currentKit]
    let kitSamples = kit.samples
    let samples = this.state.samples
    kitSamples.forEach(function(sample, i) {
      (function(index) {
        let url = self.props.audio_path + kit.path + '/' + sample
        let bapSample = bap.sample(url)
          samples[index] = bapSample
          samples[index].url = url
      })(i)
    })
    self.setState({ samples: samples }, function() {
            deferred.resolve()
          })
    return deferred.promise
  }

  loadSlots() {
    let self = this
    console.log('in loadSlots')
    console.log('samples in loadSlots', self.state.samples)
    for(let i = 0; i < self.state.samples.length; i++){
      let slot = bap.slot()
      slot.layer(self.state.samples[i])
      bapKit.slot(slots[i], slot)
    }
    console.log('pattern', pattern)
    console.log('bapKit', bapKit)
  }

  addStepListener() {//done
    if (!window) return false
    let self = this
    window.addEventListener('step', function(e) {
      let step = e.detail.step
      self.setState({ currentStep: step })
    })
  }

  playPause() {
    if (pattern.playing) {
      pattern.pause()
    }
    else{
      pattern.start()
    }
    this.setState({
      isPlaying: pattern.playing
    })
  }

  loadKit(i) {
    let self = this
    this.setState({ currentKit: i }, function() {
      self.loadSamples().then(function() {
        self.loadSlots()
      })
      self.updateUrlParams()
    })
  }

  handleTempoChange(e) {
    let self = this
    let tempo = e.target.value
    this.setTempo(tempo)
  }

  setTempo(n) {
    let self = this
    pattern.tempo = parseInt(n)
    this.setState({ tempo: pattern.tempo }, function() {
      self.updateUrlParams()
    })
  }

  updateClips(clips) {
    this.setState({ clips: clips })
    this.updatePatternChannel(clips)
  }

  updatePatternChannel(clips) {
    let self = this
    let chan = bap.channel()
    clips.forEach(function(clip, trackIndex){
      let notes = self.bitPatternToNotes(clip, trackIndex)
      notes.forEach(function(note){
        chan.add(note)
      })
    })
    pattern.channel(1, chan)
    console.log('channel', chan)
  }

  bitPatternToNotes(clip, trackIndex) {
    let self = this
    let notes = []
    // let ticks = ['01', '26', '51', '76']
    let ticks = ['01', '29', '51', '80']
    clip.pattern.forEach(function(bit, index){
      if(bit){
        notes.push(['1.' + notePosition(index) + '.' + ticks[index % 4], '1' + slots[trackIndex]])
      }
    })
    return notes
  }

  initBap() {
    let self = this
    if (!bap) { return false }
    pattern = bap.pattern({ tempo: self.state.tempo, bars: self.state.bars })
    bapKit = bap.kit()
    pattern.kit(1, bapKit)
    this.setTempo(this.state.tempo)
    let clips = this.initClips()
    this.setState({
      clips: clips,
      isPlaying: pattern.playing
    }, function() {
      self.loadBank(self.state.currentBank)
      self.loadSamples().then(function() {
        console.log('samples', self.state.samples)
        self.loadSlots()
      })
    })
    this.addStepListener()
  }

  updateUrlParams() {
    if (!window) { return false }
    let params = {
      tempo: this.state.tempo,
      currentKit: this.state.currentKit,
      currentBank: this.state.currentBank,
    }
    let query = '?' + qs.stringify(params)
    window.history.pushState(params, 'groovr', query)
  }

  componentDidMount() {
    let self = this
    if (window) {
      let params = qs.parse(window.location.search)
      this.setState(params)
    }
    this.initBap()
    if (document) {
      document.onkeydown = function(e) {
        //console.log(e.which)
        switch (e.which) {
          case 32:
            e.preventDefault()
            self.playPause()
            break
          default:
            break
        }
      }
    }
  }

  render() {
    let containerStyle = {
      minHeight: '100vh'
    }
    return (
      <div className="flex flex-column"
        style={containerStyle}>
        <Toolbar {...this.props} {...this.state}
          playPause={this.playPause.bind(this)}
          handleTempoChange={this.handleTempoChange.bind(this)}
          loadBank={this.loadBank.bind(this)}
          loadKit={this.loadKit.bind(this)}
          />
        <Sequencer {...this.props} {...this.state}
          updateClips={this.updateClips.bind(this)}
          />
        <Footer {...this.props} />
      </div>
    )
  }
}

export default App