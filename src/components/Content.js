import React, { useMemo, useRef } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { isMobile } from '../browser'
import expandContextThought from '../action-creators/expandContextThought'
import NavBar from './NavBar'
import Scale from './Scale'
import { store } from '../store'
import { EM_TOKEN, MODAL_CLOSE_DURATION, RANKED_ROOT, ROOT_TOKEN, TUTORIAL2_STEP_SUCCESS } from '../constants'
import { getSetting, getThoughtsRanked, hasChild } from '../selectors'
import { publishMode } from '../util'

// components
import NewThoughtInstructions from './NewThoughtInstructions'
import Search from './Search'
import Subthoughts from './Subthoughts'

const tutorialLocal = localStorage['Settings/Tutorial'] === 'On'
const tutorialStepLocal = +(localStorage['Settings/Tutorial Step'] || 1)

// eslint-disable-next-line jsdoc/require-jsdoc
const mapStateToProps = state => {
  const { focus, isLoading, noteFocus, search, showModal, showSplitView, activeView } = state
  const isTutorial = isLoading ? tutorialLocal : hasChild(state, [EM_TOKEN, 'Settings', 'Tutorial'], 'On')
  const tutorialStep = isLoading ? tutorialStepLocal : getSetting(state, 'Tutorial Step') || 1
  const rootThoughts = getThoughtsRanked(state, [ROOT_TOKEN])
  return {
    focus,
    search,
    showModal,
    isTutorial,
    tutorialStep,
    rootThoughts,
    noteFocus,
    showSplitView,
    activeView,
  }
}

const viewID = 'main'

/********************************************************************
 * mapDispatchToProps
 ********************************************************************/
const mapDispatchToProps = dispatch => ({
  showRemindMeLaterModal: () => dispatch({ type: 'modalRemindMeLater', MODAL_CLOSE_DURATION }),
  cursorBack: () => dispatch({ type: 'cursorBack' }),
  toggleSidebar: () => dispatch({ type: 'toggleSidebar' }),
  activateView: () => dispatch({ type: 'toggleSplitView', activeViewID: viewID })
})

/**
 * Calculates whether there was a click on the left margin or padding zone of content element.
 *
 * @param event The onClick event object.
 * @param content HTML element.
 */
const isLeftSpaceClick = (event, content) => {
  const style = window.getComputedStyle(content)
  const pTop = parseInt(style.getPropertyValue('padding-top'))
  const mTop = parseInt(style.getPropertyValue('margin-top'))
  const mLeft = parseInt(style.getPropertyValue('margin-left'))
  const x = event.clientX
  const y = event.clientY
  return x < mLeft && y > pTop + mTop
}

/** The main content section of em. */
const Content = props => {
  const { search, isTutorial, tutorialStep, showModal, showRemindMeLaterModal, cursorBack: moveCursorBack, toggleSidebar, rootThoughts, noteFocus, scale, activateView, activeView, showSplitView } = props
  const contentRef = useRef()
  const state = store.getState()

  /** Removes the cursor if the click goes all the way through to the content. Extends cursorBack with logic for closing modals. */
  const clickOnEmptySpace = e => {
    // Activate the current view if not active
    if (showSplitView && activeView !== viewID) {
      activateView()
    }
    // click event occured during text selection has focus node of type text unlike normal event which has node of type element
    // prevent text selection from calling cursorBack incorrectly
    const selection = window.getSelection()
    const focusNode = selection && selection.focusNode
    if (focusNode && focusNode.nodeType === Node.TEXT_NODE) return

    // if disableOnFocus is true, the click came from an Editable onFocus event and we should not reset the cursor
    if (showModal) {
      showRemindMeLaterModal()
    }
    else if (!noteFocus) {
      moveCursorBack()
      expandContextThought(null)
    }
  }

  /** Generate class names. */
  const contentClassNames = useMemo(() => classNames({
    content: true,
    'content-tutorial': isMobile && isTutorial && tutorialStep !== TUTORIAL2_STEP_SUCCESS,
    publish: publishMode(),
    inactive: showSplitView && activeView !== viewID,
  }), [tutorialStep, isTutorial, showSplitView, activeView])
  // Get thoughts ranked for __ROOT__
  const thoughtsRanked = getThoughtsRanked(state, RANKED_ROOT)
  // Split thoughts to show in the current view
  const thoughtsInView = thoughtsRanked.slice(0, Math.ceil(thoughtsRanked.length / 2))

  return <div id='content-wrapper' onClick={e => {
    if (!showModal && isLeftSpaceClick(e, contentRef.current)) {
      toggleSidebar()
    }
  }}>
    <div
      id='content'
      ref={contentRef}
      className={contentClassNames}
      onClick={clickOnEmptySpace}
    >
      {search != null
        ? <Search />
        : <React.Fragment>
          {rootThoughts.length === 0 ? <NewThoughtInstructions children={rootThoughts} /> : <Subthoughts
            childrenForced={showSplitView ? thoughtsInView : null}
            thoughtsRanked={RANKED_ROOT}
            expandable={true}
          />}
        </React.Fragment>
      }
    </div>
    <div className='nav-bottom-wrapper'>
      <Scale amount={scale}>
        <NavBar position='bottom' />
      </Scale>
    </div>
  </div>
}

export default connect(mapStateToProps, mapDispatchToProps)(Content)
