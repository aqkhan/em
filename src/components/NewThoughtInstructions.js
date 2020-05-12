import React from 'react'
import { connect } from 'react-redux'
import assert from 'assert'
import { isMobile } from '../browser'
import { shortcutById } from '../shortcuts'
import { store } from '../store'

// constants
import {
  TUTORIAL_STEP_FIRSTTHOUGHT,
} from '../constants'

// components
import GestureDiagram from './GestureDiagram'

// selectors
import { getSetting, isTutorial } from '../selectors'

// assert the search shortcut at load time
const newThoughtShortcut = shortcutById('newThought')
assert(newThoughtShortcut)

const mapStateToProps = state => {
  const { isLoading, status } = state
  return {
    isLoading,
    status,
    tutorialStep: +getSetting(state, 'Tutorial Step')
  }
}

const NewThoughtInstructions = ({ children, isLoading: localLoading, status, tutorialStep }) =>

  // loading
  // show loading message if local store is loading or if remote is loading and there are no children
  localLoading || ((status === 'connecting' || status === 'loading') && children.length === 0) ? <div className='center-in-content'>
    <i className='text-note'>Loading...</i>
  </div>

  // tutorial no children
  // show special message when there are no children in tutorial
  : isTutorial(store.getState())
    ? children.length === 0 && (tutorialStep !== TUTORIAL_STEP_FIRSTTHOUGHT || !isMobile)
      ? <div className='center-in-content'>
        <i className='text-note'>Ahhh. Open space. Unlimited possibilities.</i>
      </div>
    // hide on mobile during TUTORIAL_STEP_FIRSTTHOUGHT since the gesture diagram is displayed
      : null

  // default
    : <React.Fragment>
      <React.Fragment>{isMobile
        ? <span className='gesture-container'>Swipe <GestureDiagram path={newThoughtShortcut.gesture} size='30' color='darkgray' /></span>
        : <span>Hit the Enter key</span>
      } to add a new thought.</React.Fragment>
    </React.Fragment>

export default connect(mapStateToProps)(NewThoughtInstructions)
