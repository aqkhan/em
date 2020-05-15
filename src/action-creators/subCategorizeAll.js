// action-creators
import newThought from './newThought'
import error from './error'

// constants
import {
  RANKED_ROOT,
  RENDER_DELAY,
} from '../constants'

// util
import {
  contextOf,
  ellipsize,
  headValue,
  isEM,
  isRoot,
  pathToContext,
} from '../util'

// selectors
import {
  getThoughtsRanked,
  lastThoughtsFromContextChain,
  meta,
  splitChain,
} from '../selectors'

export default () => (dispatch, getState) => {

  const state = getState()
  const { cursor } = state
  if (!cursor) return

  // Cancel if a direct child of EM_TOKEN or ROOT_TOKEN
  if (isEM(contextOf(cursor)) || isRoot(contextOf(cursor))) {
    dispatch(error(`Subthought of the "${isEM(contextOf(cursor)) ? 'em' : 'home'} context" may not be de-indented.`))
    return
  }
  // cancel if parent is readonly
  else if (meta(state, pathToContext(contextOf(cursor))).readonly) {
    dispatch(error(`"${ellipsize(headValue(contextOf(cursor)))}" is read-only so "${headValue(cursor)}" cannot be subcategorized.`))
    return
  }
  else if (meta(state, pathToContext(contextOf(cursor))).unextendable) {
    dispatch(error(`"${ellipsize(headValue(contextOf(cursor)))}" is unextendable so "${headValue(cursor)}" cannot be subcategorized.`))
    return
  }

  const contextChain = splitChain(state, cursor)
  const thoughtsRanked = cursor.length > 1
    ? contextOf(contextChain.length > 1
      ? lastThoughtsFromContextChain(state, contextChain)
      : cursor)
    : RANKED_ROOT

  const children = getThoughtsRanked(state, thoughtsRanked)

  const { rank } = dispatch(newThought({
    at: cursor.length > 1 ? contextOf(cursor) : RANKED_ROOT,
    insertNewSubthought: true,
    insertBefore: true
  }))

  setTimeout(() => {
    children.forEach(child => {
      dispatch({
        type: 'existingThoughtMove',
        oldPath: contextOf(cursor).concat(child),
        newPath: contextOf(cursor).concat({ value: '', rank }, child)
      })
    })
  }, RENDER_DELAY)
}
