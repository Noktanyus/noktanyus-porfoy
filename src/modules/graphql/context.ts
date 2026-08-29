/**
 * @file GraphQL Context
 * @description Her request'te resolver'lara geçirilen context objesi.
 */

export interface GraphQLContext {
  /** Login olan kullanıcının ID'si */
  userId: string | null;
  /** Kullanıcı rolü (admin, user, vb.) */
  role: string | null;
  /** Request ID (logging için) */
  requestId?: string;
  /** Client IP (rate limiting için) */
  ip?: string;
}