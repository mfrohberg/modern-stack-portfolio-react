// tslint:disable
/**
 * @file @todo split styled pieces
 */
import * as React from 'react'
import Head from 'next/head'
import {
  ResumeContext,
  ResumeContextType,
} from '../../src/features/ResumeContext'
import { StyledCard } from '../../src/features/Card'
import { StyledMain } from '../../src/features/Main'
import { StyledLink } from '../../src/features/Link'
import { WorkType } from '../../src/typings'
import {
  StyledGrid,
  StyledCardImage,
  StyledCardFigure,
  StyledLeaderBoard,
} from './styled'
import { TimeRange } from './TimeRange'

/**
 * @hack images with specific sizes
 */
function renderWork(work: WorkType) {
  return (
    <StyledCard key={work.company + work.startDate + work.endDate}>
      <StyledCardFigure>
        <StyledCardImage
          width="1000"
          height="692"
          src={work.picture}
          shouldUsePicture={true}
          // just using srcSizeList for this currently
          // srcset={`
          //   ${work.picture} 980w,
          //   ${work.picture.replace('m-', 'xl-')} 2477w,
          //   ${work.picture.replace('m-', 'w-')} 5000w,
          //   ${work.picture.replace('m-', 'w-m-')} 1000vw
          // `.replace(/[\s\n]+/gm, ' ')}
          srcSizeList={[
            ['(max-width: 800px)', work.picture.replace('m-', 'm-')],
            ['(max-width: 1000px)', work.picture.replace('m-', 'w-m-')],
            ['(min-width: 2000px)', work.picture.replace('m-', 'xl-')],
          ]}
          alt={`work picture for ${work.company}`}
        />
        <figcaption>
          <header>{work.company}</header>
          <section>
            <strong>{work.position}</strong>
            <p>{work.highlights}</p>
            <p>{work.summary}</p>
            <StyledLink to={work.website}>{work.website}</StyledLink>
          </section>
          <section>
            <TimeRange startDate={work.startDate} endDate={work.endDate} />
          </section>
        </figcaption>
      </StyledCardFigure>
    </StyledCard>
  )
}

/**
 * @todo now Provide `work` & `basics` ?
 *
 * @todo could provide a cool graph to sort resumes too and highlight
 *       like build your own github
 */
export class ResumePage extends React.PureComponent {
  static contextType = ResumeContext
  readonly context: ResumeContextType

  render() {
    const { name, summary } = this.context.basics
    const titleText = `${name}'s Resume`

    return (
      <>
        <Head>
          <title>{titleText}</title>
          <meta name="description" content={summary || titleText} />
        </Head>
        <StyledMain>
          <StyledLeaderBoard>
            <h1>What I've done</h1>
          </StyledLeaderBoard>
          <StyledGrid>{this.context.work.map(renderWork)}</StyledGrid>
        </StyledMain>
      </>
    )
  }
}
