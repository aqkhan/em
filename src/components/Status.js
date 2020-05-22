import React from 'react'
import { connect } from 'react-redux'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

// eslint-disable-next-line jsdoc/require-jsdoc
const mapStateToProps = ({ autologin, status }) => ({
  autologin,
  status,
})

/** Displays the connection/loading status. */
const Status = ({ autologin, status }) =>
  autologin ? <div className='status'>
    <TransitionGroup>
      {status === 'offline' ? <CSSTransition key={0} timeout={200} classNames='fade'><span className='offline'>Offline</span></CSSTransition>
      : null}
    </TransitionGroup>
  </div> : null

export default connect(mapStateToProps)(Status)
