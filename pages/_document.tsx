/**
 * @see http://microformats.org/wiki/rel-profile
 * @see https://nextjs.org/docs/
 * @see https://github.com/dfrankland/react-amphtml/issues/29
 * @see https://developers.google.com/web/fundamentals/performance/resource-prioritization#preconnect
 * @see https://css-tricks.com/prefetching-preloading-prebrowsing/#article-header-id-3
 * @see https://medium.com/clio-calliope/making-google-fonts-faster-aadf3c02a36d
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
 */
import * as React from 'react'
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  NextDocumentContext,
} from 'next/document'
import { ServerStyleSheet } from 'styled-components'
import { AmpScripts, AmpScriptsManager } from 'react-amphtml/setup'
import * as Amp from 'react-amphtml'
import { fromReqToUrl } from '../src/utils/fromReqToUrl'
import { AmpContext } from '../src/features/AmpContext'
import {
  AmpServiceWorkerHeadScript,
  AmpServiceWorkerBodyScript,
} from '../src/features/ServiceWorker'
import {
  GoogleTagManagerHeaderScript,
  GoogleTagManagerBodyScript,
} from '../src/features/GoogleTagManager'

/* eslint-disable react/no-danger */
/**
 * @note not using context here as it would be used 2x in the render flow
 * @note would use keys if this switched during 1 request
 */
class AmpHtml extends React.PureComponent<{ isAmp?: boolean }> {
  render() {
    return this.props.isAmp === false ? (
      <Html lang="en" prefix="og: https://ogp.me/ns#">
        {this.props.children}
      </Html>
    ) : (
      <Amp.Html specName="html ⚡ for top-level html" lang="en" amp="amp">
        {this.props.children}
      </Amp.Html>
    )
  }
}

// tslint:disable:max-classes-per-file

function addAmpToUrl(href: string) {
  if (href.endsWith('/')) {
    return href + 'amp'
  } else if (href.includes('?')) {
    const [first, second] = href.split('?')
    return first + '/amp?' + second
  } else {
    return href + '/amp'
  }
}

/**
 * @note we are inlining this to avoid amp violations where `next` gives duplicate tags
 * @see https://github.com/dfrankland/react-amphtml/blob/7221879f49f289855a2574557afbead811c532a8/src/setup/headerBoilerplate.js
 */
class AmpHeader extends React.PureComponent<{ href: string; isAmp: boolean }> {
  render() {
    const { isAmp, href } = this.props
    if (isAmp === false) {
      return <link rel="amphtml" href={addAmpToUrl(href)} />
    }

    return (
      <>
        <link
          key={'canonical-link'}
          rel="canonical"
          href={href.replace('/amp', '')}
        />
        <style
          key={'style'}
          amp-boilerplate=""
          dangerouslySetInnerHTML={{
            __html: `
          body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
        `,
          }}
        />
        <noscript key={'noscript'}>
          <style
            amp-boilerplate=""
            dangerouslySetInnerHTML={{
              __html: `
            body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
          `,
            }}
          />
        </noscript>
      </>
    )
  }
}

export interface DocumentProps {
  isAmp: boolean
  title: string
  url: URL
  ampScriptTags?: React.ReactNode
  ampStyleTag?: React.ReactNode
}
export default class MyDocument extends Document<DocumentProps> {
  static async getInitialProps(ctx: Required<NextDocumentContext>) {
    const url = fromReqToUrl(ctx.req as any)
    const isAmp = url.href.includes('?amp') || url.href.includes('/amp')
    const ampScripts = new AmpScripts()
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: React.ComponentType) => (props: {
            [key: string]: unknown
          }) => {
            return sheet.collectStyles(
              <AmpContext.Provider value={{ isAmp }}>
                {isAmp === true ? (
                  <AmpScriptsManager ampScripts={ampScripts as any}>
                    <App {...props} />
                  </AmpScriptsManager>
                ) : (
                  <App {...props} />
                )}
              </AmpContext.Provider>
            )
          },
        })

      const ampScriptTags = isAmp === true && ampScripts.getScriptElements()
      const initialProps = await Document.getInitialProps(ctx)

      const styleElements = sheet.getStyleElement()

      // AMP only allows for 1 style tag, so we need to compbine all the style
      // tags generated by styled-components
      /* eslint-disable react/no-danger */
      const ampStyleTag = isAmp === true && (
        <style
          amp-custom=""
          dangerouslySetInnerHTML={{
            __html: styleElements.reduce(
              (
                css,
                {
                  props: {
                    dangerouslySetInnerHTML: { __html = '' } = {} as any,
                  } = {} as any,
                } = {} as any
              ) => `${css}${__html}`,
              ''
            ),
          }}
        />
      )

      return {
        isAmp,
        url,
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {isAmp === false && styleElements}
          </>
        ),
        ampScriptTags,
        ampStyleTag,
      }
      /* eslint-enable */
    } finally {
      sheet.seal()
    }
  }

  render() {
    const { isAmp, title, url, ampScriptTags, ampStyleTag } = this.props
    const shouldSkipAnalytics = url.href.includes('shouldSkipAnalytics')

    return (
      <AmpHtml isAmp={isAmp}>
        <Head>
          <AmpHeader href={url.href} isAmp={isAmp} />
          {title}
          {ampScriptTags}
          {ampStyleTag}
          <meta itemProp="accessibilityControl" content="fullKeyboardControl" />
          <meta itemProp="accessibilityControl" content="fullMouseControl" />
          <meta itemProp="typicalAgeRange" content="20-60" />

          <link rel="dns-prefetch" href="https://fonts.gstatic.com/" />
          <link rel="preconnect" href="https://fonts.gstatic.com/" />
          <link rel="dns-prefetch" href="https://fonts.gstatic.com/" />

          <link
            rel="preload"
            href="https://fonts.gstatic.com/s/sourcesanspro/v12/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rwlxdu3cOWxw.woff2"
            as="font"
            crossOrigin={'crossOrigin'}
          />
          <link
            rel="preload"
            href="https://fonts.gstatic.com/s/sourcesanspro/v12/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7lujVj9w.woff2"
            as="font"
            crossOrigin={'crossOrigin'}
          />
          <link
            rel="preload"
            href="https://fonts.gstatic.com/s/sourcesanspro/v12/6xKydSBYKcSV-LCoeQqfX1RYOo3ik4zwlxdu3cOWxw.woff2"
            as="font"
            crossOrigin={'crossOrigin'}
          />

          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="preconnect" href="https://www.google-analytics.com" />
          <link
            rel="preload"
            href="https://www.google-analytics.com/analytics.js"
            as="script"
            // crossOrigin={'crossOrigin'}
          />
          <link
            rel="preload"
            href={`https://www.googletagmanager.com/gtm.js?id=${
              process.env.GOOGLE_TAG_MANAGER_WEB_ID
            }`}
            as="script"
            // crossOrigin={'crossOrigin'}
          />

          {shouldSkipAnalytics === false && (
            <GoogleTagManagerHeaderScript isAmp={isAmp} />
          )}
          {isAmp === true && <AmpServiceWorkerHeadScript />}
        </Head>
        <body>
          {shouldSkipAnalytics === false && (
            <GoogleTagManagerBodyScript isAmp={isAmp} />
          )}
          <Main />
          {isAmp === true && <AmpServiceWorkerBodyScript />}
          {isAmp === false && <NextScript />}
        </body>
      </AmpHtml>
    )
  }
}
