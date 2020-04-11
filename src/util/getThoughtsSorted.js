import { store } from '../store'

// util
import { compareThought } from './compareThought'
import { getThought } from '../selectors'
import { hashContext } from './hashContext'
import { sort } from './sort'

/** Generates children sorted by their values. */
export const getThoughtsSorted = (context, thoughtIndex, contextIndex) => {
  thoughtIndex = thoughtIndex || store.getState().thoughtIndex
  contextIndex = contextIndex || store.getState().contextIndex
  return sort(
    (contextIndex[hashContext(context)] || [])
      .filter(child => child.value != null && getThought(store.getState(), child.value)),
    compareThought
  )
}

// useful for debugging
window.getThoughtsSorted = getThoughtsSorted
