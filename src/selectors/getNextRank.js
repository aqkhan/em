// selectors
import {
  getThoughtsRanked,
} from '../selectors'

/** Gets the next rank at the end of a list. */
export default (state, context) => {
  const children = getThoughtsRanked(state, context)
  return children.length > 0
    ? children[children.length - 1].rank + 1
    : 0
}
