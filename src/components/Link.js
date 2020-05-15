import React from 'react'
import { connect } from 'react-redux'
import { store } from '../store'

// constants
import {
  EM_TOKEN,
} from '../constants'

// util
import {
  decodeCharacterEntities,
  ellipsize,
  equalArrays,
  headValue,
  pathToContext,
  strip,
} from '../util'

// selectors
import { hashContextUrl } from '../selectors'

// renders a link with the appropriate label to the given context
const Link = ({ thoughtsRanked, label, charLimit = 32, dispatch }) => {
  const emContext = equalArrays(pathToContext(thoughtsRanked), [EM_TOKEN])
  const value = label || strip(headValue(thoughtsRanked))

  // TODO: Fix tabIndex for accessibility
  return <a tabIndex='-1' href={hashContextUrl(store.getState(), pathToContext(thoughtsRanked))} className='link' onClick={e => { // eslint-disable-line react/no-danger-with-children
    e.preventDefault()
    document.getSelection().removeAllRanges()
    dispatch({ type: 'search', value: null })
    dispatch({ type: 'setCursor', thoughtsRanked })
    dispatch({ type: 'toggleSidebar', value: false })
    // updateUrlHistory(rankThoughtsFirstMatch(e.shiftKey ? [head(thoughts)] : thoughts, store.getState().thoughtIndex))
  }} dangerouslySetInnerHTML={emContext ? { __html: '<b>em</b>' } : null}>{!emContext ? ellipsize(decodeCharacterEntities(value), charLimit) : null}</a>
}

export default connect()(Link)
