/**
 * POST /api/v1/finance/tax-offices — GİB Vergi Daireleri & Kodları Rehberi API
 * İl, ilçe, vergi dairesi adı veya koduna göre fuzzy arama ve UBL-TR snippet desteği.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import {
  searchTaxOffices,
  getTaxOfficeByCode,
  listTaxOfficesByProvince,
  generateUblTaxSchemeSnippet,
  TAX_OFFICES,
} from '@/modules/tr-api/taxOffices';

const TaxOfficesSchema = z.object({
  query: z.string().optional(),
  provinceCode: z.string().max(2).optional(),
  code: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
});

export const POST = withTrApi(TaxOfficesSchema, async (data) => {
  if (data.code) {
    const office = getTaxOfficeByCode(data.code);
    if (!office) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Belirtilen vergi dairesi kodu (${data.code}) bulunamadı.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        office,
        ublScheme: generateUblTaxSchemeSnippet(office),
      },
    });
  }

  if (data.provinceCode && !data.query) {
    const offices = listTaxOfficesByProvince(data.provinceCode);
    return NextResponse.json({
      success: true,
      data: {
        total: offices.length,
        provinceCode: data.provinceCode,
        offices: offices.slice(0, data.limit),
      },
    });
  }

  const results = searchTaxOffices(data.query || '', {
    provinceCode: data.provinceCode,
    limit: data.limit,
  });

  return NextResponse.json({
    success: true,
    data: {
      totalFound: results.length,
      totalCatalog: TAX_OFFICES.length,
      results,
    },
  });
});
