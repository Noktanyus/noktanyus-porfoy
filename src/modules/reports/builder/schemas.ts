/**
 * @file Report Builder Schemas
 * @description G3: Custom report builder için veri yapıları.
 *
 *              Kullanıcı şunları seçebilir:
 *              - Source (User, Order, Subscription, vb.)
 *              - Metrics (count, sum, avg, min, max)
 *              - Dimensions (group by alanları)
 *              - Filters (alan, operator, değer)
 *              - Date range
 *              - Sort + limit
 */

export type ReportSource =
  | "users"
  | "orders"
  | "subscriptions"
  | "products"
  | "customers"
  | "messages";

export type MetricFunction = "count" | "sum" | "avg" | "min" | "max";

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "in"
  | "between"
  | "isNull"
  | "isNotNull";

export interface MetricConfig {
  field: string;
  function: MetricFunction;
  /** Gösterim için label. Boşsa otomatik üretilir. */
  label?: string;
  /** Para birimi (sum/avg için) */
  currency?: string;
}

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  source: ReportSource;
  metrics: MetricConfig[];
  /** Group by — pivot tarzı raporlar için */
  dimensions: string[];
  filters: FilterConfig[];
  /** Tarih aralığı filtresi — createdAt alanına uygulanır */
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: {
    field: string;
    direction: "asc" | "desc";
  };
  limit?: number;
  /** Paylaşım ayarı */
  isPublic?: boolean;
}

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface ReportResult {
  config: ReportConfig;
  rows: ReportRow[];
  totalRows: number;
  generatedAt: Date;
  /** Çalıştırma süresi (ms) */
  executionTimeMs: number;
}

/**
 * Source başına izin verilen alanlar.
 * SQL injection'a karşı whitelist yaklaşımı.
 */
export const SOURCE_FIELDS: Record<ReportSource, ReadonlyArray<string>> = {
  users: ["id", "email", "name", "role", "createdAt", "emailVerified"],
  orders: ["id", "customerId", "totalAmount", "status", "createdAt", "currency"],
  subscriptions: ["id", "userId", "planId", "status", "currentPeriodEnd", "createdAt"],
  products: ["id", "name", "price", "currency", "active", "createdAt"],
  customers: ["id", "email", "name", "totalSpent", "createdAt"],
  messages: ["id", "name", "email", "read", "createdAt"],
};

/**
 * Source başına izin verilen metric function'lar.
 */
export const SOURCE_METRIC_FUNCTIONS: Record<ReportSource, ReadonlyArray<MetricFunction>> = {
  users: ["count"],
  orders: ["count", "sum", "avg", "min", "max"],
  subscriptions: ["count"],
  products: ["count", "avg", "min", "max"],
  customers: ["count", "sum", "avg"],
  messages: ["count"],
};

/**
 * Operator validasyonu için izin verilen operator listesi.
 */
export const VALID_OPERATORS: ReadonlyArray<FilterOperator> = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "in",
  "between",
  "isNull",
  "isNotNull",
];

/**
 * ReportConfig validation — güvenlik ve veri bütünlüğü için.
 * SQL injection ve invalid field reference'ları önler.
 */
export function validateReportConfig(config: ReportConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push("name gerekli");
  }

  if (config.name && config.name.length > 200) {
    errors.push("name 200 karakterden uzun olamaz");
  }

  const allowedSources: ReportSource[] = [
    "users",
    "orders",
    "subscriptions",
    "products",
    "customers",
    "messages",
  ];
  if (!allowedSources.includes(config.source)) {
    errors.push(`gecersiz source: ${config.source}`);
  }

  // Metric field validation
  if (config.metrics.length === 0) {
    errors.push("en az 1 metric gerekli");
  }
  const allowedFields = SOURCE_FIELDS[config.source];
  config.metrics.forEach((m, i) => {
    if (!allowedFields?.includes(m.field)) {
      errors.push(`metric[${i}].field gecersiz: ${m.field}`);
    }
    const allowedFunctions = SOURCE_METRIC_FUNCTIONS[config.source];
    if (!allowedFunctions?.includes(m.function)) {
      errors.push(`metric[${i}].function ${m.source ?? config.source} icin gecersiz`);
    }
  });

  // Filter validation
  config.filters.forEach((f, i) => {
    if (!allowedFields?.includes(f.field)) {
      errors.push(`filter[${i}].field gecersiz: ${f.field}`);
    }
    if (!VALID_OPERATORS.includes(f.operator)) {
      errors.push(`filter[${i}].operator gecersiz: ${f.operator}`);
    }
  });

  // Dimensions validation
  config.dimensions.forEach((d, i) => {
    if (!allowedFields?.includes(d)) {
      errors.push(`dimension[${i}] gecersiz: ${d}`);
    }
  });

  // Limit validation
  if (config.limit !== undefined && (config.limit < 1 || config.limit > 10000)) {
    errors.push("limit 1-10000 arasinda olmali");
  }

  return { valid: errors.length === 0, errors };
}