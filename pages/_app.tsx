/**
 * @see https://shaleenjain.com/blog/nextjs-apollo-prefetc
 * @file mostly copied from following link
 * @see https://github.com/zeit/next.js/blob/master/examples/with-apollo/lib/with-apollo-client.js#L23
 * @tutorial https://www.apollographql.com/docs/react/recipes/server-side-rendering.html
 */
import App, { Container, NextAppContext } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import { ApolloClient } from 'apollo-boost'
import * as React from 'react'
import { ApolloProvider, getDataFromTree } from 'react-apollo'
import { initApolloClient } from '../src/apolloClient'
import '../src/apolloStateRehydrate'
import { PortfolioProvider } from '../src/features/PortfolioContext'
import Footer from '../src/features/Footer'
import Header from '../src/features/Header'
import { analyticsContainer } from '../src/features/GoogleTagManager'
import { StyledVectorFilter } from '../src/features/VectorFilter'
import { AppContextProvider } from '../src/features/AppContext'
import { fromReqToUrl } from '../src/utils/fromReqToUrl'
import { URL } from '../src/utils/url'
import { logger } from '../src/log'
import { AppStyles, BelowTheFoldStyles } from '../src/AppStyles'
import { UnknownObj } from '../src/typings'
import {
  DataLoading,
  DataLoadingProvider,
} from '../src/features/ServerSideRendering'

// tslint:disable:max-classes-per-file
export class InnerApp extends React.PureComponent<{
  apolloClientState?: UnknownObj
  apolloClient?: ApolloClient<any>
  url: URL
  dataLoadingContextValue: DataLoading
}> {
  render() {
    const {
      apolloClient,
      dataLoadingContextValue,
      apolloClientState,
      url,
      children,
    } = this.props

    const contextValue = DataLoading.from(dataLoadingContextValue)

    /**
     * @todo error boundary around children
     */
    return (
      <React.StrictMode>
        <ApolloProvider
          client={
            apolloClient || initApolloClient(apolloClientState as any, url)
          }
        >
          <DataLoadingProvider contextValue={contextValue}>
            <PortfolioProvider>
              <AppStyles />
              <Header />
              {children}
              <Footer />
              <StyledVectorFilter />
              <BelowTheFoldStyles />
            </PortfolioProvider>
          </DataLoadingProvider>
        </ApolloProvider>
      </React.StrictMode>
    )
  }
}

export default class MyApp extends App<{
  /** these come from getInitialProps */
  apolloClientState?: UnknownObj
  apolloClient?: ApolloClient<any>
  dataLoadingContextValue?: DataLoading
  url: URL
}> {
  static async getInitialProps(appContext: NextAppContext) {
    const { Component, ctx } = appContext
    const url = fromReqToUrl(ctx.req as any)
    const pageProps = {}

    let appProps = {} as any
    if (App.getInitialProps) {
      appProps = await App.getInitialProps(appContext)
    }

    const dataLoadingContextValue = new DataLoading()
    const apolloClient = initApolloClient(undefined, url)

    if (!process.browser) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[_app] starting ssr (server)')
      }

      try {
        /**
         * @note !!! this does not properly ssr if we render `<App>` (even if we pass in apolloClient) !!!
         * @description Run all GraphQL queries
         * @note this is really bad @@perf
         * @description ideally we would combine this into a single tree walking
         *              to get other data needed in ssr to rehydrate from
         * @note this uses old `Context`
         * @see https://github.com/apollographql/react-apollo/blob/master/src/getDataFromTree.ts
         * @see https://github.com/apollographql/react-apollo/blob/master/src/Query.tsx#L164
         */
        await getDataFromTree(
          <InnerApp
            apolloClient={apolloClient}
            url={url}
            dataLoadingContextValue={dataLoadingContextValue}
          >
            <Component {...appProps} />
          </InnerApp>
        )
      } catch (error) {
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
        console.error('Error while running `getDataFromTree`', error)
      }

      // load context ssr data
      await dataLoadingContextValue.all()

      // getDataFromTree does not call componentWillUnmount
      // head side effect therefore need to be cleared manually
      Head.rewind()
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[_app] starting ssr (browser, rehydrate)')
      }
      analyticsContainer.initializeAnalytics()
    }

    // Extract query data from the Apollo store
    const apolloClientState = apolloClient.cache.extract()

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[_app] done ssr')
    }

    return {
      ...appProps,
      pageProps,
      url,
      apolloClientState,
      dataLoadingContextValue,
    } as ReturnType<typeof App.getInitialProps> & {
      apolloState: UnknownObj
      dataLoadingContextValue: DataLoading
    }
  }

  componentDidMount() {
    /**
     * @see https://github.com/zeit/next.js/issues/6025
     * @see https://github.com/zeit/next.js/issues/4044
     * using this because the url was out of date
     */
    Router.onRouteChangeComplete = (pathUrl?: string) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[_app] route complete ' + pathUrl)
      }
      this.setState({
        url: new URL(window.location.href),
      })
    }
  }

  /**
   * when this is rehydrated, the serialized obj is not a URL object
   */
  state = {
    url:
      typeof this.props.url === 'string'
        ? new URL(this.props.url)
        : this.props.url,
  }

  render() {
    const urlObj = this.state.url
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[_app] render ')
    }

    const {
      Component,
      pageProps,
      apolloClientState,
      dataLoadingContextValue,
    } = this.props

    return (
      <Container>
        <AppContextProvider url={urlObj}>
          <InnerApp
            apolloClientState={apolloClientState}
            url={urlObj}
            dataLoadingContextValue={dataLoadingContextValue!}
          >
            <Component {...pageProps} />
          </InnerApp>
        </AppContextProvider>
      </Container>
    )
  }
}
