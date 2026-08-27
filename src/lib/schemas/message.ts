import { z } from 'zod';

export const MessageReplySchema = z.object({
  message: z.string().min(1).max(5000),
  sentAt: z.coerce.date(),
  sentBy: z.string().min(1).max(100),
});

export const RepliesSchema = z.array(MessageReplySchema);

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter').max(100),
  email: z.string().email('Geçerli bir e-posta girin'),
  subject: z.string().min(3, 'Konu en az 3 karakter').max(200),
  message: z.string().min(10, 'Mesaj en az 10 karakter').max(5000),
  turnstileToken: z.string().min(1, 'Doğrulama gerekli'),
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;
export type MessageReply = z.infer<typeof MessageReplySchema>;