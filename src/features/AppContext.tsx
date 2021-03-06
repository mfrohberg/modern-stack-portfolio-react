/**
 * @todo could also use PageContext
 */
import * as React from 'react'
import { createContext } from 'react'
import { URL } from '../utils/url'

/**
 * @todo can observe the scrolling, etc
 */
export interface AppContextValueType {
  /**
   * url of the current page (_universal_)
   */
  url: URL
  /**
   * the available window height
   */
  height?: number
  /**
   * the available window width
   */
  width?: number
}

/**
 * could move to a `constants` file
 */
export const DEFAULT_URL = new URL('https://localhost')

export const AppContext = createContext<AppContextValueType>({
  url: DEFAULT_URL as any,
  height: 0,
  width: 0,
})

export class AppContextProvider extends React.PureComponent<{ url: URL }> {
  render() {
    const { url, children } = this.props
    const contextValue = { url }
    return (
      <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    )
  }
}
