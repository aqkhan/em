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
  getNextRank,
  getRankBefore,
  getSortPreference,
  getThoughtBefore,
  hasChild,
  prevSibling,
} from '../selectors'

/** Swaps the thought with its previous siblings. */
const moveThoughtUp = (state: State) => {

  const { cursor } = state

  if (!cursor) return state

  const thoughts = pathToContext(cursor)
  const pathParent = contextOf(cursor)
  const context = pathToContext(pathParent)
  const value = headValue(cursor)
  const rank = headRank(cursor)

  const prevThought = prevSibling(state, value, rootedContextOf(cursor) as any, rank)

  // if the cursor is the first thought or the context is sorted, move the thought to the end of its prev uncle
  const prevUncleThought = pathParent.length > 0 ? getThoughtBefore(state, pathParent) : null
  const prevUnclePath = prevUncleThought ? contextOf(pathParent).concat(prevUncleThought) : null

  if (!prevThought && !prevUnclePath) return state

  // get sorted state
  const isSorted = getSortPreference(state, context) === 'Alphabetical'

  // metaprogramming functions that prevent moving
  if (isSorted && !prevUnclePath) {
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

  // get selection offset before existingThoughtMove is dispatched
  const offset = window.getSelection()?.focusOffset

  const rankNew = prevThought && !isSorted
    // previous thought (unsorted)
    ? getRankBefore(state, pathParent.concat(prevThought))
    // first thought in previous uncle
    : getNextRank(state, pathToContext(prevUnclePath!))

  const newPath = (prevThought && !isSorted ? pathParent : prevUnclePath!).concat({
    value,
    rank: rankNew
  })

  return existingThoughtMove(state, {
    oldPath: cursor,
    newPath,
    offset,
  })
}

export default moveThoughtUp
