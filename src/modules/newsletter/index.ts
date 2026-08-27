/**
 * Newsletter Module — Barrel Export
 *
 * Public API: servis, repository ve şemalar tek noktadan export edilir.
 * API route'lar `@/modules/newsletter` üzerinden import eder.
 *
 *   import { newsletterService, newsletterRepository } from '@/modules/newsletter';
 *   import { SubscribeSchema } from '@/modules/newsletter';
 */

export { newsletterService } from './service';
export * as newsletterServiceModule from './service';
export * from './schemas';
export {
  newsletterRepository,
  NewsletterRepository,
} from './repository';