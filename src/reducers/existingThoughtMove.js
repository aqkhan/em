import _ from 'lodash'
import { ID } from '../constants'
import { treeMove } from '../util/recentlyEditedTree'
import { render, updateThoughts } from '../reducers'
import { getNextRank, getThought, getThoughtsRanked } from '../selectors'

// util
import {
  addContext,
  compareByRank,
  contextOf,
  equalArrays,
  equalThoughtRanked,
  equalThoughtValue,
  hashContext,
  hashThought,
  head,
  headRank,
  moveThought,
  pathToContext,
  reducerFlow,
  removeContext,
  removeDuplicatedContext,
  rootedContextOf,
  sort,
  subsetThoughts,
  timestamp,
} from '../util'

/** Moves a thought from one context to another, or within the same context. */
export default (state, { oldPath, newPath, offset }) => {
  const thoughtIndexNew = { ...state.thoughts.thoughtIndex }
  const oldThoughts = pathToContext(oldPath)
  const newThoughts = pathToContext(newPath)
  const value = head(oldThoughts)
  const key = hashThought(value)
  const oldRank = headRank(oldPath)
  const newRank = headRank(newPath)
  const oldContext = rootedContextOf(oldThoughts)
  const newContext = rootedContextOf(newThoughts)
  const sameContext = equalArrays(oldContext, newContext)
  const oldThought = getThought(state, value)
  const newThought = removeDuplicatedContext(moveThought(oldThought, oldContext, newContext, oldRank, newRank), newContext)
  const isPathInCursor = subsetThoughts(state.cursor, oldPath)

  // Uncaught TypeError: Cannot perform 'IsArray' on a proxy that has been revoked at Function.isArray (#417)
  let recentlyEdited = state.recentlyEdited // eslint-disable-line fp/no-let
  try {
    recentlyEdited = treeMove(state.recentlyEdited, oldPath, newPath)
  }
  catch (e) {
    console.error('existingThoughtMove: treeMove immer error')
    console.error(e)
  }

  // preserve contextIndex
  const contextEncodedOld = hashContext(oldContext)
  const contextEncodedNew = hashContext(newContext)

  // if the contexts have changed, remove the value from the old contextIndex and add it to the new
  const subthoughtsOld = (state.thoughts.contextIndex[contextEncodedOld] || [])
    .filter(child => !equalThoughtRanked(child, { value, rank: oldRank }))

  const duplicateSubthought = sort(state.thoughts.contextIndex[contextEncodedNew] || [], compareByRank)
    .find(equalThoughtValue(value))

  const isDuplicateMerge = duplicateSubthought && !sameContext

  const subthoughtsNew = (state.thoughts.contextIndex[contextEncodedNew] || [])
    .filter(child => child.value !== value)
    .concat({
      value,
      rank: isDuplicateMerge ? duplicateSubthought.rank : newRank,
      lastUpdated: timestamp()
    })

  /** Updates descendants. */
  const recursiveUpdates = (oldThoughtsRanked, newThoughtsRanked, contextRecursive = [], accumRecursive = {}) => {

    const newLastRank = getNextRank(state, newThoughtsRanked)

    return getThoughtsRanked(state, oldThoughtsRanked).reduce((accum, child, i) => {
      const hashedKey = hashThought(child.value)
      const childThought = getThought({ thoughts: { thoughtIndex: thoughtIndexNew } }, child.value)

      // remove and add the new context of the child
      const contextNew = newThoughts.concat(contextRecursive)

      // update rank of first depth of childs except when a thought has been moved within the same context
      const movedRank = !sameContext && newLastRank ? newLastRank + i : child.rank
      const childNewThought = removeDuplicatedContext(addContext(removeContext(childThought, pathToContext(oldThoughtsRanked), child.rank), contextNew, movedRank), contextNew)

      // update local thoughtIndex so that we do not have to wait for firebase
      thoughtIndexNew[hashedKey] = childNewThought

      const accumNew = {
        // merge ancestor updates
        ...accumRecursive,
        // merge sibling updates
        // Order matters: accum must have precendence over accumRecursive so that contextNew is correct
        ...accum,
        // merge current thought update
        [hashedKey]: {
          value: child.value,
          rank: (childNewThought.contexts || []).find(context => equalArrays(context.context, contextNew)).rank,
          thoughtIndex: childNewThought,
          context: pathToContext(oldThoughtsRanked),
          contextsOld: ((accumRecursive[hashedKey] || {}).contextsOld || []).concat([pathToContext(oldThoughtsRanked)]),
          contextsNew: ((accumRecursive[hashedKey] || {}).contextsNew || []).concat([contextNew])
        }
      }

      return {
        ...accumNew,
        ...recursiveUpdates(oldThoughtsRanked.concat(child), newThoughtsRanked.concat(child), contextRecursive.concat(child.value), accumNew)
      }
    }, {})
  }

  const descendantUpdatesResult = recursiveUpdates(oldPath, newPath)
  const descendantUpdates = _.transform(descendantUpdatesResult, (accum, value, key) => {
    accum[key] = value.thoughtIndex
  }, {})

  const contextIndexDescendantUpdates = sameContext
    ? {}
    : _.transform(descendantUpdatesResult, (accum, result, hashedKey) => {
      const output = result.contextsOld.reduce((accumInner, contextOld, i) => {
        const contextNew = result.contextsNew[i]
        const contextEncodedOld = hashContext(contextOld)
        const contextEncodedNew = hashContext(contextNew)
        return {
          ...accumInner,
          [contextEncodedOld]: (accum[contextEncodedOld] || state.thoughts.contextIndex[contextEncodedOld] || [])
            .filter(child => child.value !== result.value),
          [contextEncodedNew]: (accum[contextEncodedNew] || state.thoughts.contextIndex[contextEncodedNew] || [])
            .filter(child => child.value !== result.value)
            .concat({
              value: result.value,
              rank: result.rank,
              lastUpdated: timestamp()
            })
        }
      }, {})
      Object.assign(accum, output) // eslint-disable-line fp/no-mutating-assign
    }, {})

  const contextIndexUpdates = {
    [contextEncodedOld]: subthoughtsOld,
    [contextEncodedNew]: subthoughtsNew,
    ...contextIndexDescendantUpdates
  }

  const thoughtIndexUpdates = {
    [key]: newThought,
    ...descendantUpdates
  }

  thoughtIndexNew[key] = newThought

  // preserve contextViews
  const contextViewsNew = { ...state.contextViews }
  if (state.contextViews[contextEncodedNew] !== state.contextViews[contextEncodedOld]) {
    contextViewsNew[contextEncodedNew] = state.contextViews[contextEncodedOld]
    delete contextViewsNew[contextEncodedOld] // eslint-disable-line fp/no-delete
  }

  /** Updates the ranks within the given path to match those in descendantUpdatesResult. */
  const updateMergedThoughtsRank = path => path.map(
    child => {
      const updatedThought = descendantUpdatesResult[hashThought(child.value)]
      return { ...child, rank: updatedThought ? updatedThought.rank : child.rank }
    }
  )

  // if duplicate subthoughts are merged then update rank of thoughts of cursor descendants
  const cursorDescendantPath = (isPathInCursor && isDuplicateMerge ? updateMergedThoughtsRank : ID)(state.cursor || []).slice(oldPath.length)

  // if duplicate subthoughts are merged then use rank of the duplicate thought in the new path instead of the newly calculated rank
  const updatedNewPath = isPathInCursor && isDuplicateMerge
    ? contextOf(newPath).concat(duplicateSubthought)
    : newPath

  const newCursorPath = isPathInCursor
    ? updatedNewPath.concat(cursorDescendantPath)
    : state.cursor

  const stateNew = {
    ...state,
    contextViews: contextViewsNew,
    cursor: newCursorPath,
    cursorBeforeEdit: newCursorPath,
    cursorOffset: offset,
  }

  return reducerFlow([

    // update thoughts
    state => updateThoughts(state, { thoughtIndexUpdates, contextIndexUpdates, recentlyEdited }),

    // render
    render,

  ])(stateNew)
}
