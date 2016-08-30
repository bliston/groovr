import iconPaths from 'geomicons-open/src/js/paths'

import React, { Component } from 'react'

class Icon extends Component {

  render() {
    var path = iconPaths[this.props.icon]
    var style = {
      fill: 'currentColor'
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="icon"
        style={style}>
        <path d={path} />
      </svg>
    )
  }
}
Icon.defaultProps = {
      icon: 'warning',
      path: '',
}
export default Icon