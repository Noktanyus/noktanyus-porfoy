/**
 * Admin Module — Service Layer
 *
 * Cross-cutting admin işlemleri:
 * - Testimonial CRUD
 * - (Phase 2E) Audit log
 * - (Phase 2F/2G) Stripe & Resend köprüleri
 */

import { testimonialRepository } from './repository';

export const adminService = {
  // Testimonials
  listTestimonials() {
    return testimonialRepository.findMany();
  },

  getTestimonial(id: string) {
    return testimonialRepository.findById(id);
  },

  createTestimonial(input: { name: string; title: string; company: string; avatar?: string | null; comment: string }) {
    return testimonialRepository.create(input);
  },

  updateTestimonial(id: string, input: Partial<{ name: string; title: string; company: string; avatar: string | null; comment: string }>) {
    return testimonialRepository.update(id, input);
  },

  deleteTestimonial(id: string) {
    return testimonialRepository.delete(id);
  },
};