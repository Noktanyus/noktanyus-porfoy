/**
 * Admin Module — Repository Layer
 *
 * Admin panelinin ihtiyaç duyduğu cross-cutting repository'ler.
 * (Content repository'leri zaten @/modules/content içinde.)
 */

import { BaseRepository } from '../shared/repository';
import type { Testimonial } from '@prisma/client';

/**
 * Admin action audit log için basit bir tabloya yazabilir.
 * Phase 2E tamamlanınca burada gerçek AuditLog modeli gelecek.
 */
export class TestimonialRepository extends BaseRepository<Testimonial> {
  protected get model() {
    return this.prisma.testimonial;
  }
}

export const testimonialRepository = new TestimonialRepository();