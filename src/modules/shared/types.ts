/**
 * Shared repository interface & helper types
 *
 * Tüm modüllerin repository katmanı bu interface'i implemente eder.
 * Böylece servis katmanı somut Prisma implementasyonuna değil,
 * interface'e bağımlı kalır → swap edilebilir, mock'lanabilir, test edilebilir.
 */

export interface FindManyArgs<TWhere = any, TOrderBy = any> {
  skip?: number;
  take?: number;
  where?: TWhere;
  orderBy?: TOrderBy;
}

export interface FindFirstArgs<TWhere = any> {
  where: TWhere;
}

export interface Repository<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TWhere = any,
  TOrderBy = any,
> {
  findMany(args?: FindManyArgs<TWhere, TOrderBy>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findFirst(args: FindFirstArgs<TWhere>): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
  count(args?: { where?: TWhere }): Promise<number>;
}

/**
 * Bir alanı required yapar (partial type'lar için kullanışlı).
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Standart liste filtresi (skip, take, where).
 */
export interface ListOptions<TWhere = any> {
  skip?: number;
  take?: number;
  where?: TWhere;
}