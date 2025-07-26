import type {
  About,
  Experience,
  Skill,
  Testimonial,
  Blog as PrismaBlog,
  Project as PrismaProject,
  Popup as PrismaPopup,
  Message as PrismaMessage,
  HomeSettings,
  SeoSettings as PrismaSeoSettings,
} from '@prisma/client';

// Re-exporting Prisma types to be used in the app
export type {
  About,
  Experience,
  Skill,
  Testimonial,
  HomeSettings,
};

// Re-exporting Prisma types directly since they now use Json fields
export type {
  Blog as PrismaBlog,
  Project as PrismaProject,
  Popup as PrismaPopup,
  Message as PrismaMessage,
} from '@prisma/client';

// Type aliases for consistency
export type Blog = PrismaBlog;
export type Project = PrismaProject;
export type Popup = PrismaPopup;
export type Message = PrismaMessage;

/**
 * Represents the About data including its relations (Experience and Skill).
 * This is useful for pages that need to display the full "About Me" section.
 */
export type AboutWithRelations = About & {
  experiences: Experience[];
  skills: Skill[];
};

/**
 * Alias for About type for backward compatibility
 */
export type AboutData = About;

/**
 * Represents the SeoSettings from Prisma.
 * Re-exported for consistency.
 */
export type SeoSettings = PrismaSeoSettings;