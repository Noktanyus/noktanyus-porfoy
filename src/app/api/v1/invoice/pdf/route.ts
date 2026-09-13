/**
 * POST /api/v1/invoice/pdf — fatura/teklif PDF (GIB e-fatura değil)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { buildInvoicePdf } from '@/modules/tr-api';

const BodySchema = z.object({
  sellerName: z.string().min(1).max(200),
  sellerTaxId: z.string().max(20).optional(),
  buyerName: z.string().min(1).max(200),
  buyerTaxId: z.string().max(20).optional(),
  invoiceNumber: z.string().min(1).max(64),
  issueDate: z.string().max(32).optional(),
  currency: z.string().max(8).optional(),
  notes: z.string().max(1000).optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1).max(300),
        quantity: z.number().positive().max(1_000_000),
        unitPriceCents: z.number().int().nonnegative(),
        vatRate: z.number().min(0).max(100).optional(),
      })
    )
    .min(1)
    .max(100),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const pdf = buildInvoicePdf(data);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${data.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
    },
  });
});
