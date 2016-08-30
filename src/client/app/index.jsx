import React from 'react'
import {render} from 'react-dom'
import App from './app.jsx'
import data from './data'

let _App = React.createFactory(App)

render(
  _App(data),
  document.getElementById('app')
)