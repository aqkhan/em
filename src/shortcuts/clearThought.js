// util
import {
  isDocumentEditable,
  setSelection,
} from '../util'

const clearThoughtShortcut = {
  id: 'clearThought',
  name: 'Clear Thought',
  description: 'Clear the text of the current thought.',
  gesture: 'rl',
  // eslint-disable-next-line
  canExecute: () => isDocumentEditable(),
  // eslint-disable-next-line
  exec: () => {
    const editable = document.querySelector('.editing .editable')
    if (editable) {
      const text = editable.innerHTML
      setSelection(editable)

      // need to delay DOM changes on mobile for some reason so that this works when edit mode is false
      setTimeout(() => {
        editable.innerHTML = ''
        editable.setAttribute('placeholder', text)
      })
    }
  }
}

export default clearThoughtShortcut
