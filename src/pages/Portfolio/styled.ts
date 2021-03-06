import styled from 'styled-components'
import { ObservablePicture } from '../../features/ObservablePicture'

export const StyledGrid = styled.div`
  display: grid;
  padding: 1rem;
  grid-gap: 0.5rem;
  grid-auto-rows: auto;
`

/**
 * could use https://amp.dev/documentation/examples/components/amp-timeago/
 */
export const StyledTime = styled.time`
  display: inline-flex;
`

/**
 * @see https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
 * @see https://addyosmani.com/blog/lazy-loading/
 */
export const StyledCardImage = styled(ObservablePicture).attrs({
  loading: 'lazy',
})`
  filter: url(#green-tint);
  max-width: 100%;
  > img {
    max-width: 100%;
  }
`

export const StyledCardFigure = styled.figure`
  margin: 0;
  padding: 0;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: calc(50vw - 2rem) calc(50vw - 2rem);
    grid-gap: 1rem;

    picture,
    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
    figcaption {
      padding: 1.25rem 0;
    }
  }
  @media (max-width: 1023px) {
    img {
      max-height: 65vh;
    }
  }
`

/**
 * could pick a colour from a colour scheme each time...
 */
export const StyledLeaderBoard = styled.header`
  background-color: var(--color-orange);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0 2rem 0;

  > h1 {
    color: white;
    font-size: 3em;
    font-weight: 300;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55), 0 2px 0 rgba(0, 0, 0, 0.1),
      0 3px 0 rgba(0, 0, 0, 0.1), 0 4px 0 rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding-top: 8rem;
  }
`
