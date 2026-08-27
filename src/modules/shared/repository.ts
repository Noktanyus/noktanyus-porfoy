/**
 * Base Repository Pattern
 *
 * Tüm domain repository'leri bu abstract class'tan türer.
 * PrismaClient'a doğrudan bağımlılığı azaltır, ortak CRUD operasyonlarını
 * standartlaştırır ve servis katmanının kolayca mock'lanmasını sağlar.
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { FindManyArgs, FindFirstArgs, ListOptions } from './types';

export abstract class BaseRepository<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TWhere = any,
  TOrderBy = any,
> {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Alt sınıflar Prisma model delegate'ini döner (this.prisma.blog gibi).
   */
  protected abstract get model(): any;

  async findMany(args?: FindManyArgs<TWhere, TOrderBy>): Promise<T[]> {
    return this.model.findMany(args);
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findFirst(args: FindFirstArgs<TWhere>): Promise<T | null> {
    return this.model.findFirst(args);
  }

  async create(data: TCreate): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: TUpdate): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }

  async count(args?: { where?: TWhere }): Promise<number> {
    return this.model.count(args);
  }
}

/**
 * Singleton modeller için yardımcı mixin.
 *
 * About, HomeSettings, SeoSettings gibi tek satır tablolar için kullanılır.
 * findFirst + (varsa update, yoksa create) pattern'i sağlar.
 */
export abstract class SingletonRepository<T, TUpdate = Partial<T>> {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  protected abstract get model(): any;

  async get(): Promise<T | null> {
    return this.model.findFirst();
  }

  async upsert(data: TUpdate): Promise<T> {
    const current = await this.model.findFirst();
    if (current) {
      return this.model.update({ where: { id: current.id }, data });
    }
    return this.model.create({ data });
  }
}

/**
 * Generic list helper — repository'ler arasında ortak pagination mantığı.
 */
export async function paginate<T>(
  listFn: (args: ListOptions) => Promise<T[]>,
  options?: ListOptions
): Promise<T[]> {
  return listFn({
    skip: options?.skip,
    take: options?.take,
    where: options?.where,
  });
}