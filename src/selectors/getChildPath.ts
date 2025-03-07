import { State } from '../util/initialState'
import { Child, Path, ThoughtContext } from '../types'
import { getThoughts, rankThoughtsFirstMatch } from '../selectors'
import { hashThought, head, headValue, unroot } from '../util'

/** Because the current thought only needs to hash match another thought we need to use the exact value of the child from the other context child.context SHOULD always be defined when showContexts is true. */
const getChildPath = (state: State, child: Child | ThoughtContext, thoughtsRanked: Path, showContexts?: boolean) => {

  const otherSubthought = (showContexts && (child as ThoughtContext).context ? getThoughts(state, (child as ThoughtContext).context) : [])
    .find(child => hashThought(child.value) === hashThought(headValue(thoughtsRanked)))
    || head(thoughtsRanked)

  const childPath = showContexts
    ? rankThoughtsFirstMatch(state, (child as ThoughtContext).context).concat(otherSubthought)
    : unroot(thoughtsRanked).concat(child as Child)

  return childPath
}

export default getChildPath
