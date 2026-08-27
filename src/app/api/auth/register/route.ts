/**
 * @file Kullanıcı kayıt (register) endpoint'i.
 * @description POST /api/auth/register
 *              Yeni kullanıcı hesabı oluşturur. Email benzersiz olmalıdır.
 *              Şifre bcrypt ile (12 round) hash'lenir.
 *
 *              Güvenlik:
 *              - Rate limiting (api bucket)
 *              - Zod validation
 *              - Hassas veri (şifre) response/logger'a ASLA düşmez
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail, withErrorHandling } from "@/lib/apiResponse";
import { withRateLimit } from "@/lib/rateLimitMiddleware";
import { RateLimits } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

const RegisterSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçerli bir e-posta girin").max(200).transform((s) => s.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(100, "Şifre en fazla 100 karakter olabilir")
    .regex(/[A-Za-z]/, "Şifre en az bir harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Admin email ile aynı email'i kayıt etmesini engelle
    if (process.env.ADMIN_EMAIL && data.email === process.env.ADMIN_EMAIL.toLowerCase()) {
      throw new AppError("Bu e-posta adresi kullanılamaz", 400, "RESERVED_EMAIL");
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      throw new AppError("Bu e-posta zaten kayıtlı", 409, "EMAIL_TAKEN");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info("User registered", { userId: user.id, email: user.email });

    return ok(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  });
});
