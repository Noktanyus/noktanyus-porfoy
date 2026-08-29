/**
 * @file GraphQL Schema (SDL)
 * @description D1: GraphQL API gateway — schema definition.
 *              Build-time SDL → executable schema dönüşümü resolver'lar ile yapılır.
 *
 *              Tip sistemi:
 *              - Query: read-only veri erişimi
 *              - Mutation: veri değişikliği (auth required)
 *              - Subscription: real-time event stream (WebSocket)
 */

export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  enum OrderStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
    CANCELED
  }

  enum SubscriptionStatus {
    ACTIVE
    CANCELED
    EXPIRED
    PAST_DUE
  }

  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    emailVerified: DateTime
    createdAt: DateTime!
  }

  type Order {
    id: ID!
    customerId: ID!
    totalAmount: Float!
    currency: String!
    status: OrderStatus!
    createdAt: DateTime!
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    orderId: ID!
    productId: ID!
    quantity: Int!
    price: Float!
  }

  type Subscription {
    id: ID!
    userId: ID!
    planId: ID!
    status: SubscriptionStatus!
    currentPeriodEnd: DateTime
    createdAt: DateTime!
  }

  type Plan {
    id: ID!
    name: String!
    price: Float!
    currency: String!
    interval: String!
    active: Boolean!
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    currency: String!
    active: Boolean!
  }

  type RevenueMetrics {
    mrr: Float!
    arr: Float!
    churnRate: Float!
    ltv: Float!
    arpu: Float!
  }

  type Query {
    """Tek bir kullanıcıyı ID ile getir"""
    user(id: ID!): User
    """Tüm kullanıcılar (sayfalama destekli)"""
    users(limit: Int = 20, offset: Int = 0): [User!]!
    """Tek bir siparişi getir"""
    order(id: ID!): Order
    """Siparişleri filtrele"""
    orders(
      status: OrderStatus
      customerId: ID
      limit: Int = 20
      offset: Int = 0
    ): [Order!]!
    """Tüm planlar"""
    plans: [Plan!]!
    """Revenue metrikleri"""
    revenueMetrics: RevenueMetrics!
    """Health check"""
    health: String!
  }

  type Mutation {
    """Sipariş durumunu güncelle (admin only)"""
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
    """Kullanıcı rolünü değiştir (admin only)"""
    updateUserRole(userId: ID!, role: String!): User!
  }

  type Subscription {
    """Yeni sipariş event'i (admin real-time dashboard için)"""
    orderCreated: Order!
  }
`;