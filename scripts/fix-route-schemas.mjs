import fs from 'fs';

const map = {
  'src/app/api/v1/validate/mac/route.ts': "  mac: z.string().min(11).max(24),",
  'src/app/api/v1/validate/asn/route.ts': "  asn: z.string().min(1).max(16),",
  'src/app/api/v1/validate/iso-country/route.ts': "  code: z.string().min(2).max(3),",
  'src/app/api/v1/validate/iso-language/route.ts': "  code: z.string().min(2).max(8),",
  'src/app/api/v1/validate/iata/route.ts': "  code: z.string().length(3),",
  'src/app/api/v1/validate/icao/route.ts': "  code: z.string().length(4),",
  'src/app/api/v1/validate/timezone/route.ts': "  zone: z.string().min(3).max(64),",
  'src/app/api/v1/validate/semver/route.ts': "  version: z.string().min(1).max(64),",
  'src/app/api/v1/validate/slug/route.ts': "  slug: z.string().min(1).max(128),",
  'src/app/api/v1/validate/color/route.ts': "  color: z.string().min(4).max(16),",
  'src/app/api/v1/validate/locale/route.ts': "  locale: z.string().min(2).max(16),",
};

for (const [p, line] of Object.entries(map)) {
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/  \w+: z\.union\(\[[^\]]+\]\),/, line);
  fs.writeFileSync(p, s);
  console.log(p, s.includes('z.union') ? 'STILL UNION' : 'ok');
}
