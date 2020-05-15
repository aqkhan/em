import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { isMobile } from '../browser'
import { store } from '../store.js'

// components
import ContentEditable from 'react-contenteditable'

// action-creators
import deleteAttribute from '../action-creators/deleteAttribute'
import setAttribute from '../action-creators/setAttribute'

// util
import {
  asyncFocus,
  hasAttribute,
  selectNextEditable,
  setSelection,
} from '../util'

// selectors
import {
  attribute,
  isContextViewActive,
} from '../selectors'

// gets the editable node for the given note element
const editableOfNote = noteEl =>
  noteEl.parentNode.previousSibling.querySelector('.editable')

const Note = ({ context, thoughtsRanked, contextChain }) => {

  const state = store.getState()
  const hasNote = hasAttribute(context, '=note')

  if (!hasNote || isContextViewActive(state, context)) return null

  const dispatch = useDispatch()
  const noteRef = useRef()
  const note = attribute(state, context, '=note')

  const onKeyDown = e => {
    // delete empty note
    // need to get updated note attribute (not the note in the outside scope)
    const note = attribute(store.getState(), context, '=note')

    // select thought
    if (e.key === 'Escape' || e.key === 'ArrowUp' || (e.metaKey && e.altKey && e.keyCode === 'N'.charCodeAt(0))) {
      e.stopPropagation()
      editableOfNote(e.target).focus()
      setSelection(editableOfNote(e.target), { end: true })
    }
    // delete empty note
    // (delete non-empty note is handled by delete shortcut, which allows mobile gesture to work)
    // note may be '' or null if the attribute child was deleted
    else if (e.key === 'Backspace' && !note) {
      e.stopPropagation() // prevent delete thought
      e.preventDefault()

      if (isMobile) {
        asyncFocus()
      }
      editableOfNote(e.target).focus()
      setSelection(editableOfNote(e.target), { end: true })

      dispatch(deleteAttribute(context, '=note'))
    }
    else if (e.key === 'ArrowDown') {
      e.stopPropagation()
      e.preventDefault()
      selectNextEditable(editableOfNote(e.target))
    }
  }

  const onChange = e => {
    // Mobile Safari inserts <br> when all text is deleted
    // Strip <br> from beginning and end of text
    dispatch(setAttribute(context, '=note', e.target.value.replace(/^<br>|<br>$/gi, '')))
  }

  const onFocus = e => {
    dispatch({ type: 'setCursor', thoughtsRanked, contextChain, cursorHistoryClear: true, editing: false, noteFocus: true })
  }

  const onBlur = e => {
    window.getSelection().removeAllRanges()
  }

  return <div className='note children-subheading text-note text-small' style={{ top: '4px' }}>
    <ContentEditable
      html={note || ''}
      innerRef={noteRef}
      placeholder='Enter a note'
      onKeyDown={onKeyDown}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  </div>
}

export default Note
