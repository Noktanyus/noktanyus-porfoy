/**
 * Comments Module — Zod Schemas
 *
 * Yorum oluşturma/güncelleme input validation.
 */

import { z } from 'zod';

export const CreateCommentSchema = z.object({
  blogId: z.string().min(1, 'Geçersiz blog referansı'),
  content: z
    .string()
    .min(3, 'Yorum en az 3 karakter olmalı')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
  parentId: z.string().optional(),
});

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(3, 'Yorum en az 3 karakter olmalı')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
