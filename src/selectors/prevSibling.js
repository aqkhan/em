import { getSortPreference, getThoughtsRanked, getThoughtsSorted, hasChild } from '../selectors'
import { isFunction } from '../util'

/**
 * Gets a context's previous sibling with its rank.
 *
 * @param context   Can be a context or path.
 */
export default (state, value, context, rank) => {
  const { showHiddenThoughts } = state
  const sortPreference = getSortPreference(state, context)
  const siblings = (sortPreference === 'Alphabetical' ? getThoughtsSorted : getThoughtsRanked)(state, context)
  let prev// eslint-disable-line fp/no-let

  /** Returns true when thought is not hidden due to being a function or having a =hidden attribute. */
  const isVisible = thoughtRanked => showHiddenThoughts || (
    !isFunction(thoughtRanked.value) &&
    !hasChild(state, [...context, thoughtRanked.value], '=hidden')
  )

  siblings.find(child => {
    if (child.value === value && child.rank === rank) {
      return true
    }
    else if (!isVisible(child)) {
      return false
    }
    else {
      prev = child
      return false
    }
  })
  return prev
}
