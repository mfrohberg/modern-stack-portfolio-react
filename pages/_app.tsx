/**
 * @see https://shaleenjain.com/blog/nextjs-apollo-prefetc
 * @file mostly copied from following link
 * @see https://github.com/zeit/next.js/blob/master/examples/with-apollo/lib/with-apollo-client.js#L23
 */
import App, { Container, NextAppContext } from 'next/app'
import Head from 'next/head'
import { ApolloClient } from 'apollo-boost'
import * as React from 'react'
import { ApolloProvider, getDataFromTree } from 'react-apollo'
import '../src/utils/polyfill'
import { initApolloClient } from '../src/apolloClient'
import '../src/apolloStateRehydrate'
import { ResumeProvider } from '../src/features/ResumeContext'
import { ResumeSchema } from '../src/features/ResumeSchema'
import { ResumeHead } from '../src/features/ResumeHead'
import Footer from '../src/features/Footer'
import Header from '../src/features/Header'
import { StyledVectorFilter } from '../src/features/VectorFilter'
import { fromReqToUrl } from '../src/utils/fromReqToUrl'
import { AppStyles, BelowTheFoldStyles } from '../src/AppStyles'
import { UnknownObj } from '../src/typings'

export class InnerApp extends React.PureComponent<{
  apolloClientState?: UnknownObj
  apolloClient?: ApolloClient<any>
  url: URL
}> {
  render() {
    const { apolloClient, apolloClientState, url, children } = this.props

    return (
      <React.StrictMode>
        <ApolloProvider
          client={apolloClient || initApolloClient(apolloClientState as any)}
        >
          <ResumeProvider>
            <AppStyles />
            <ResumeSchema />
            <ResumeHead url={url} />
            <Header />
            {children}
            <Footer />
            <StyledVectorFilter />
            <BelowTheFoldStyles />
          </ResumeProvider>
        </ApolloProvider>
      </React.StrictMode>
    )
  }
}

export default class MyApp extends App<{
  /** these come from getInitialProps */
  apolloClientState?: UnknownObj
  apolloClient?: ApolloClient<any>
  url: URL
}> {
  static async getInitialProps(appContext: NextAppContext) {
    const { Component, router, ctx } = appContext
    const url = fromReqToUrl(ctx.req as any)
    const pageProps = {}

    let appProps = {} as any
    if (App.getInitialProps) {
      appProps = await App.getInitialProps(appContext)
    }

    const apolloClient = initApolloClient()

    if (!process.browser) {
      try {
        /**
         * @note !!! this does not properly ssr if we render `<App>` (even if we pass in apolloClient) !!!
         * @description Run all GraphQL queries
         */
        await getDataFromTree(
          <InnerApp apolloClient={apolloClient} url={url}>
            <Component {...appProps} />
          </InnerApp>
        )
      } catch (error) {
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
        console.error('Error while running `getDataFromTree`', error)
      }

      // getDataFromTree does not call componentWillUnmount
      // head side effect therefore need to be cleared manually
      Head.rewind()
    }

    // Extract query data from the Apollo store
    const apolloClientState = apolloClient.cache.extract()

    return {
      ...appProps,
      pageProps,
      url,
      apolloClientState,
    } as ReturnType<typeof App.getInitialProps> & {
      apolloState: UnknownObj
    }
  }

  render() {
    // what do we use router for?
    const { Component, pageProps, apolloClientState, url } = this.props

    return (
      <Container>
        <InnerApp apolloClientState={apolloClientState} url={url}>
          <Component {...pageProps} />
        </InnerApp>
      </Container>
    )
  }
}
