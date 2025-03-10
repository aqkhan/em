import { alert, existingThoughtMove } from '../reducers'
import { State } from '../util/initialState'

// util
import {
  contextOf,
  ellipsize,
  headRank,
  headValue,
  pathToContext,
  rootedContextOf,
} from '../util'

// selectors
import {
  getPrevRank,
  getRankAfter,
  getSortPreference,
  getThoughtAfter,
  hasChild,
  nextSibling,
} from '../selectors'

/** Swaps the thought with its next siblings. */
const moveThoughtDown = (state: State) => {

  const { cursor } = state

  if (!cursor) return state

  const thoughts = pathToContext(cursor)
  const pathParent = contextOf(cursor)
  const context = pathToContext(pathParent)
  const value = headValue(cursor)
  const rank = headRank(cursor)

  const nextThought = nextSibling(state, value, rootedContextOf(pathToContext(cursor)), rank)

  // if the cursor is the last child or the context is sorted, move the thought to the beginning of its next uncle
  const nextUncleThought = pathParent.length > 0 ? getThoughtAfter(state, pathParent) : null
  const nextUnclePath = nextUncleThought ? contextOf(pathParent).concat(nextUncleThought) : null

  if (!nextThought && !nextUnclePath) return state

  // get sorted state
  const isSorted = getSortPreference(state, context) === 'Alphabetical'

  if (isSorted && !nextUnclePath) {
    return alert(state, {
      value: `Cannot move subthoughts of "${ellipsize(headValue(contextOf(cursor)))}" while sort is enabled.`
    })
  }
  else if (hasChild(state, thoughts, '=readonly')) {
    return alert(state, {
      value: `"${ellipsize(headValue(cursor))}" is read-only and cannot be moved.`
    })
  }
  else if (hasChild(state, thoughts, '=immovable')) {
    return alert(state, {
      value: `"${ellipsize(headValue(cursor))}" is immovable.`
    })
  }
  else if (hasChild(state, context, '=readonly')) {
    return alert(state, {
      value: `Subthoughts of "${ellipsize(headValue(contextOf(cursor)))}" are read-only and cannot be moved.`
    })
  }
  else if (hasChild(state, context, '=immovable')) {
    return alert(state, {
      value: `Subthoughts of "${ellipsize(headValue(contextOf(cursor)))}" are immovable.`
    })
  }

  // store selection offset before existingThoughtMove is dispatched
  const offset = window.getSelection()?.focusOffset

  const rankNew = nextThought && !isSorted
    // next thought (unsorted)
    ? getRankAfter(state, pathParent.concat(nextThought))
    // first thought in next uncle
    : getPrevRank(state, pathToContext(nextUnclePath!))

  const newPath = (nextThought && !isSorted ? pathParent : nextUnclePath!).concat({
    value,
    rank: rankNew
  })

  return existingThoughtMove(state, {
    oldPath: cursor,
    newPath,
    offset,
  })
}

export default moveThoughtDown
