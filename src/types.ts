import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { State } from './util/initialState'

declare global {
  interface Window {
      firebase:any;
  }
}

/** A timestamp string. */
export type Timestamp = string

/** An entry in thoughtIndex[].contexts. */
interface ThoughtContext {
  context: Context,
  rank: number,
  lastUpdated?: Timestamp
}

/** An object that contains a list of contexts where a lexeme appears in different word forms (plural, different cases, emojis, etc). All word forms hash to a given lexeme. */
export interface Lexeme {
  rank: number,
  value: string,
  contexts: ThoughtContext[],
  created: Timestamp,
  lastUpdated: Timestamp
}

/** A parent with a list of children. */
export interface Parent {
  children: Child[],
  lastUpdated: Timestamp,
}

/** A thought with a specific rank. */
export interface Child {
  rank: number,
  value: string,
  lastUpdated?: Timestamp
}

/** A sequence of children with ranks. */
export type Path = Child[]

/** A sequence of values. */
export type Context = string[]

/** An object that contains a list of children within a context. */
export interface ParentEntry {
  children: Child[],
  lastUpdated: Timestamp,
}

/** A basic Redux action creator with no arguments. */
export type ActionCreator = ThunkAction<void, State, unknown, Action<string>>
