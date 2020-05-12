import { store } from '../store'

import { getSetting } from '../selectors'

// constants
import {
  FONT_SCALE_INCREMENT,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
} from '../constants'

export const scaleFontUp = () => {
  const fontSize = +getSetting(store.getState(), 'Font Size')
  if (fontSize < MAX_FONT_SIZE) {
    store.dispatch({
      type: 'settings',
      key: 'Font Size',
      value: Math.round((fontSize + FONT_SCALE_INCREMENT) * 10) / 10
    })
  }
}

export const scaleFontDown = () => {
  const fontSize = +getSetting(store.getState(), 'Font Size')
  if (fontSize > (MIN_FONT_SIZE + FONT_SCALE_INCREMENT)) {
    store.dispatch({
      type: 'settings',
      key: 'Font Size',
      value: Math.round((fontSize - FONT_SCALE_INCREMENT) * 10) / 10
    })
  }
}
