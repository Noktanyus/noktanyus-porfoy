/**
 * @file GraphQL schema definitions
 * @description Type definitions for the GraphQL API.
 *              Exposes read-only query surface for portfolio content:
 *              blogs, projects, digital products, plans, monitors.
 *              Includes a connection-style paginated query for blogs
 *              with category/search filtering.
 */

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Blog {
    id: ID!
    slug: String!
    title: String!
    description: String!
    date: String!
    category: String
  }

  type Project {
    id: ID!
    slug: String!
    title: String!
    description: String!
    featured: Boolean
    isLive: Boolean
  }

  type DigitalProduct {
    id: ID!
    slug: String!
    title: String!
    shortDescription: String
    priceCents: Int!
    currency: String!
    active: Boolean
  }

  type Plan {
    id: ID!
    slug: String!
    name: String!
    priceCents: Int!
    currency: String!
    features: [String!]!
  }

  type Monitor {
    id: ID!
    name: String!
    url: String!
    status: String!
  }

  input BlogFilter {
    category: String
    search: String
  }

  type BlogConnection {
    nodes: [Blog!]!
    totalCount: Int!
  }

  type Query {
    blogs(limit: Int = 10): [Blog!]!
    blog(slug: String!): Blog
    projects(limit: Int = 10): [Project!]!
    project(slug: String!): Project
    products(activeOnly: Boolean = true, limit: Int = 10): [DigitalProduct!]!
    product(slug: String!): DigitalProduct
    plans: [Plan!]!
    plan(slug: String!): Plan
    monitors(activeOnly: Boolean = true): [Monitor!]!
    blogsConnection(filter: BlogFilter, limit: Int = 10): BlogConnection!
  }
`;