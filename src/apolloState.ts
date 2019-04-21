/**
 * @fileOverview this file is for the client side graphql
 *               it can be used with the `@client` directive
 * @see https://www.apollographql.com/docs/react/essentials/local-state
 */
import { gql } from 'apollo-boost'
import { logger } from './log'
import { Resolvers, ResumeType } from './typings'
import { addTypeName } from './utils/addTypeName'
import ResumeQuery from './graphql/Resume'

export const typeDefs = gql`
  type ProfileType {
    network: string
    username: string
    url: string
  }
  type BasicsInputType {
    name: string
    label: string
    picture: string
    email: string
    telephone: string
    website: string
    summary: string
    address: string
    postalCode: string
    city: string
    countryCode: string
    region: string
    profiles: [Profile]
    resumeWebsite: string
    skills: [string]
  }
  type WorkInputType {
    company: string
    position: string
    startDate: string
    endDate: string
    summary: string
    highlights: [string]
    website: string
    picture: string
  }
  type ResumeType {
    id: ID
    basics: Basics
    work: [Work]
  }

  type AddOrUpdateResumeResponse {
    responseMessage: string
  }

  type Query {
    resume(id: ID): [ResumeType]
  }
  type Mutation {
    setResume(
      basics: BasicsInputType
      work: [WorkInputType]
    ): AddOrUpdateResumeResponse!
  }
`

export const defaultApolloStatePortfolio = {
  __typename: 'Resume',
  basics: {
    __typename: 'Basics',
    name: '',
    label: '',
    picture: '',
    email: 'james@jameswiens.com',
    telephone: '12506509455',
    website: '',
    summary: '',
    profiles: [
      {
        __typename: 'Profile',
        network: 'linkedin',
        username: 'aretecode',
        url: 'https://www.linkedin.com/in/james-wiens/',
      },
    ],
    address: '',
    postalCode: '',
    city: '',
    countryCode: '',
    region: '',
    resumeWebsite: '',
    skills: ['skill1'],
  },
  work: [
    {
      __typename: 'Work',
      company: 'Open Source',
      position: '',
      website: 'https://github.com/aretecode',
      startDate: '01/02/2013',
      endDate: 'current',
      summary: '',
      highlights: '',
      picture:
        'https://user-images.githubusercontent.com/4022631/55686780-04f0f980-5983-11e9-8152-204681b0840f.png',
    },
  ],
}

// tslint:disable typedef
// @lint: ^ this is because we have typings for resolvers
//          no need to define for each method
export const apolloState = {
  // @todo as WithTypeNameRecursive<ResumeType>
  defaults: {
    resume: defaultApolloStatePortfolio,
  },
  resolvers: {
    Query: {
      async resume(obj, args, context, info) {
        logger.info('[query] resume')

        const data = context.cache.read<{ resume: ResumeType }>({
          query: ResumeQuery,
          optimistic: true,
        })

        logger.log({ data })

        return { ...data!.resume }
      },
    },
    Mutation: {
      /**
       * @todo generate typings from graphql schema & import
       * could flatten it out
       */
      async setResume(
        obj,
        args: { id?: string; basics: { profiles?: {} }; work: unknown[] },
        context,
        info
      ) {
        logger.info('[mutation] setResume')
        logger.info(args)

        const updated = {
          __typename: 'Resume',
          basics: {
            __typename: 'Basics',
            ...args.basics,
            profiles: addTypeName('Profile', args.basics.profiles),
          },
          work: addTypeName('Work', args.work),
        }
        logger.info('[mutation] updated')
        logger.info(updated)

        context.cache.writeData({
          data: {
            resume: { ...updated },
            ...updated,
          },
        })

        return {
          __typename: 'AddOrUpdateResumeResponse',
          responseMessage: 'Success if it does not throw?',
        }
      },
    },
  } as Resolvers,
}
