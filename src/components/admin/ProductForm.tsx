/**
 * @file Admin ürün formu — Dijital ve Sanal Ürün (Lisans Doğrulama Keyi) Entegrasyonlu
 * @description Yeni ürün oluşturma ve düzenleme:
 *              - Sanal Ürün / Lisans Doğrulama Anahtarı (3. parti / harici uygulama doğrulama keyi)
 *              - İndirilebilir Dosya (kurulum paketi / arşiv)
 *              - Hibrit (kurulum paketi + lisans anahtarı)
 *              AI ile açıklama üretme butonu içerir.
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { DigitalProduct } from '@prisma/client';
import type { LicensePricingTier } from '@/modules/commerce/types';
import { PRODUCT_CATEGORIES } from '@/lib/storeCatalog';
import {
  FaCloudUploadAlt,
  FaFileArchive,
  FaCheckCircle,
  FaTrash,
  FaLink,
  FaSpinner,
  FaKey,
  FaShieldAlt,
  FaBox,
  FaInfoCircle,
  FaPlus,
  FaCoins,
} from 'react-icons/fa';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatTry(cents: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(cents / 100);
}

type ProductFormData = Pick<
  DigitalProduct,
  | 'title'
  | 'slug'
  | 'shortDescription'
  | 'description'
  | 'thumbnail'
  | 'fileUrl'
  | 'fileName'
  | 'fileSize'
  | 'priceCents'
  | 'currency'
  | 'category'
  | 'version'
  | 'downloadCountMax'
  | 'ttlHours'
  | 'active'
  | 'featured'
  | 'order'
> & {
  features: string;
};

interface ProductFormProps {
  product?: DigitalProduct;
}

export type DeliveryType = 'license_only' | 'download_only' | 'hybrid';

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!product;

  const existingReqs =
    product?.requirements &&
    typeof product.requirements === 'object' &&
    !Array.isArray(product.requirements)
      ? (product.requirements as Record<string, unknown>)
      : {};

  const initialDeliveryType: DeliveryType =
    (existingReqs.deliveryType as DeliveryType) ||
    (product?.category === 'license'
      ? 'license_only'
      : product?.fileUrl
      ? 'download_only'
      : 'license_only');

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialDeliveryType);
  const [licenseType, setLicenseType] = useState<string>(
    (existingReqs.licenseType as string) || 'ONE_TIME'
  );
  const [maxActivations, setMaxActivations] = useState<number>(
    Number(existingReqs.maxActivations) || 1
  );
  const [validityDays, setValidityDays] = useState<number>(
    Number(existingReqs.validityDays) || 0
  );
  const [appId, setAppId] = useState<string>(
    (existingReqs.appId as string) || ''
  );
  const [thirdPartyAppName, setThirdPartyAppName] = useState<string>(
    (existingReqs.thirdPartyAppName as string) || ''
  );
  const [externalAppUrl, setExternalAppUrl] = useState<string>(
    (existingReqs.externalAppUrl as string) || ''
  );
  const [activationInstructions, setActivationInstructions] = useState<string>(
    (existingReqs.activationInstructions as string) || ''
  );

  const initialPricingTiers: LicensePricingTier[] = Array.isArray(existingReqs.pricingTiers)
    ? (existingReqs.pricingTiers as LicensePricingTier[])
    : [];

  const [pricingTiers, setPricingTiers] = useState<LicensePricingTier[]>(initialPricingTiers);

  const addPricingTier = () => {
    const nextDays = pricingTiers.length === 0 ? 30 : pricingTiers.length === 1 ? 60 : 365;
    const nextPrice = pricingTiers.length === 0 ? 100000 : pricingTiers.length === 1 ? 180000 : 800000;
    const newTier: LicensePricingTier = {
      id: `tier-${Date.now()}`,
      days: nextDays,
      priceCents: nextPrice,
      label: `${nextDays} Günlük Lisans`,
      description: '',
      isPopular: pricingTiers.length === 1,
    };
    setPricingTiers((prev) => [...prev, newTier]);
    if (!watch('priceCents') || watch('priceCents') === 0) {
      setValue('priceCents', nextPrice, { shouldDirty: true });
    }
  };

  const updatePricingTier = (index: number, field: keyof LicensePricingTier, value: any) => {
    setPricingTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'days') {
        const d = Number(value) || 0;
        if (!next[index].label || next[index].label.includes('Günlük') || next[index].label.includes('Süresiz')) {
          next[index].label = d === 0 ? 'Süresiz / Ömür Boyu' : `${d} Günlük Lisans`;
        }
      }
      return next;
    });
  };

  const removePricingTier = (index: number) => {
    setPricingTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const applyStandardTiersTemplate = () => {
    const template: LicensePricingTier[] = [
      {
        id: `tier-30-${Date.now()}`,
        days: 30,
        priceCents: 100000,
        label: '30 Günlük Lisans',
        description: 'Standart 1 Aylık',
        isPopular: false,
      },
      {
        id: `tier-60-${Date.now() + 1}`,
        days: 60,
        priceCents: 180000,
        label: '60 Günlük Lisans',
        description: '%10 Tasarruflu',
        isPopular: true,
      },
      {
        id: `tier-365-${Date.now() + 2}`,
        days: 365,
        priceCents: 800000,
        label: '1 Yıllık Lisans',
        description: 'Yıllık En Avantajlı Paket',
        isPopular: false,
      },
      {
        id: `tier-0-${Date.now() + 3}`,
        days: 0,
        priceCents: 1500000,
        label: 'Süresiz / Ömür Boyu',
        description: 'Ömür Boyu Kullanım ve Güncelleme',
        isPopular: false,
      },
    ];
    setPricingTiers(template);
    setValue('priceCents', 100000, { shouldDirty: true });
    toast.success('30 Gün (1.000 ₺) / 60 Gün (1.800 ₺) / 365 Gün / Süresiz şablonu yüklendi!');
  };

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProductName, setAiProductName] = useState('');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiVariant, setAiVariant] = useState<'short' | 'medium' | 'long'>('medium');
  const [isUploading, setIsUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ProductFormData>({
    defaultValues: {
      title: product?.title ?? '',
      slug: product?.slug ?? '',
      shortDescription: product?.shortDescription ?? '',
      description: product?.description ?? '',
      thumbnail: product?.thumbnail ?? '',
      fileUrl: product?.fileUrl ?? '',
      fileName: product?.fileName ?? '',
      fileSize: product?.fileSize ?? 0,
      priceCents: product?.priceCents ?? 0,
      currency: product?.currency ?? 'try',
      category: product?.category ?? (initialDeliveryType === 'license_only' ? 'license' : 'general'),
      version: product?.version ?? '',
      downloadCountMax: product?.downloadCountMax ?? 5,
      ttlHours: product?.ttlHours ?? 72,
      active: product?.active ?? true,
      featured: product?.featured ?? false,
      order: product?.order ?? 0,
      features: '',
    },
  });

  const fileUrl = watch('fileUrl');
  const fileName = watch('fileName');
  const fileSize = watch('fileSize');

  const handleFileUpload = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Dosya boyutu 500MB sınırını aşıyor');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`${file.name} yükleniyor...`);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Dosya yükleme başarısız');
      }

      setValue('fileUrl', json.data.url, { shouldDirty: true, shouldValidate: true });
      setValue('fileName', json.data.fileName, { shouldDirty: true, shouldValidate: true });
      setValue('fileSize', Number(json.data.fileSize) || 0, { shouldDirty: true, shouldValidate: true });

      toast.success(`${json.data.fileName} başarıyla yüklendi!`, { id: toastId });
    } catch (err) {
      toast.error((err as Error).message, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!isEditMode) {
      setValue('slug', generateSlug(newTitle));
    }
  };

  const handleAiDescribe = async () => {
    if (!aiProductName || !aiFeatures) {
      toast.error('Ürün adı ve en az bir özellik gerekli');
      return;
    }
    setAiLoading(true);
    const loadingId = toast.loading('AI açıklama oluşturuyor...');
    try {
      const featuresArray = aiFeatures.split(',').map((f) => f.trim()).filter(Boolean);
      const response = await fetch('/api/admin/products/ai-generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: aiProductName,
          features: featuresArray,
          variant: aiVariant,
          language: 'tr',
          existingShortDescription: watch('shortDescription') || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message ?? 'AI yanıtı alınamadı');
      }

      const { shortDescription, description, mock, tokensUsed } = data.data;
      setValue('shortDescription', shortDescription, { shouldDirty: true });
      setValue('description', description, { shouldDirty: true });
      toast.success(
        mock
          ? 'AI mock açıklama oluşturdu (ANTHROPIC_API_KEY tanımlı değil)'
          : `AI açıklama oluşturdu (${tokensUsed.total} token)`,
        { id: loadingId }
      );
      setAiOpen(false);
    } catch (error) {
      toast.error(`AI hatası: ${(error as Error).message}`, { id: loadingId });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    // Sanal olmayan modlarda dosya zorunluluğu kontrolü
    if (deliveryType !== 'license_only' && !data.fileUrl) {
      toast.error('Lütfen bir kurulum dosyası yükleyin veya harici indirme URL\'i girin');
      return;
    }

    const loadingId = toast.loading(isEditMode ? 'Ürün güncelleniyor...' : 'Ürün oluşturuluyor...');
    try {
      const finalFileUrl =
        deliveryType === 'license_only' ? (externalAppUrl.trim() || '') : (data.fileUrl || '');
      const finalFileName =
        deliveryType === 'license_only'
          ? (externalAppUrl.trim() ? 'Harici İndirme Bağlantısı' : 'Lisans Doğrulama Anahtarı')
          : (data.fileName || 'Dosya');
      const finalFileSize = deliveryType === 'license_only' ? 0 : (Number(data.fileSize) || 0);

      const requirementsPayload = {
        deliveryType,
        licenseType,
        appId: appId.trim() || generateSlug(data.title || watch('title') || 'app'),
        maxActivations: Math.max(1, Number(maxActivations) || 1),
        validityDays: Math.max(0, Number(validityDays) || 0),
        thirdPartyAppName: thirdPartyAppName.trim(),
        externalAppUrl: externalAppUrl.trim(),
        activationInstructions: activationInstructions.trim(),
        pricingTiers: pricingTiers.map((t) => ({
          id: t.id || `tier-${t.days}-${Date.now()}`,
          days: Math.max(0, Number(t.days) || 0),
          priceCents: Math.max(0, Number(t.priceCents) || 0),
          label: t.label.trim() || (t.days === 0 ? 'Süresiz Lisans' : `${t.days} Günlük Lisans`),
          description: t.description?.trim() || undefined,
          isPopular: Boolean(t.isPopular),
        })),
      };

      const payload = {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail || null,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        priceCents: Number(data.priceCents) || 0,
        currency: data.currency,
        category: data.category,
        version: data.version || null,
        downloadCountMax: Number(data.downloadCountMax) || (deliveryType === 'license_only' ? 0 : 5),
        ttlHours: Number(data.ttlHours) || (deliveryType === 'license_only' ? 0 : 72),
        requirements: requirementsPayload,
        active: data.active,
        featured: data.featured,
        order: Number(data.order) || 0,
      };

      const url = isEditMode ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'İşlem başarısız oldu');
      }

      toast.success(isEditMode ? 'Ürün güncellendi!' : 'Ürün oluşturuldu!', { id: loadingId });
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Ürün Başlığı & Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">Ürün Başlığı *</label>
          <input
            {...register('title', { required: 'Başlık zorunludur' })}
            id="title"
            onChange={(e) => {
              register('title').onChange(e);
              onTitleChange(e);
            }}
            placeholder="örn: Masaüstü POS & Stok Yönetimi Lisansı"
            className="admin-input"
          />
          {errors.title && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">Slug *</label>
          <input {...register('slug', { required: 'Slug zorunludur' })} id="slug" className="admin-input" />
          {errors.slug && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      {/* 2. Fiyat ve Para Birimi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="priceCents" className="block text-sm font-medium mb-2">Fiyat (kuruş) *</label>
          <input
            type="number"
            {...register('priceCents', { required: 'Fiyat zorunludur', valueAsNumber: true, min: 0 })}
            id="priceCents"
            className="admin-input"
          />
          <p className="text-xs text-muted-foreground mt-1">Örn: 50000 = 500,00 ₺</p>
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-2">Para Birimi</label>
          <select {...register('currency')} id="currency" className="admin-input">
            <option value="try">TRY</option>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
      </div>

      {/* 3. ÜRÜN VE TESLİMAT MODELİ SEÇİCİ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold">
            Ürün ve Teslimat Modeli *
          </label>
          <span className="text-xs text-muted-foreground">
            {deliveryType === 'license_only'
              ? '🔑 Sanal Ürün Modu'
              : deliveryType === 'download_only'
              ? '💾 Dosya İndirme Modu'
              : '📦 Hibrit Mod'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Sanal Ürün / Lisans Keyi */}
          <div
            onClick={() => {
              setDeliveryType('license_only');
              setValue('category', 'license', { shouldDirty: true });
            }}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              deliveryType === 'license_only'
                ? 'border-amber-500/80 bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-amber-500/30 shadow-sm'
                : 'border-border/70 hover:border-amber-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FaKey className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">Sanal Ürün / Lisans Keyi</h4>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">3. Parti / Harici Uygulama</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Müşteri mevcut bir 3. parti veya harici uygulamayı aktive etmek / doğrulamak için lisans anahtarı satın alır. Dosya yükleme zorunlu değildir.
            </p>
          </div>

          {/* Card 2: İndirilebilir Dosya */}
          <div
            onClick={() => {
              setDeliveryType('download_only');
              if (watch('category') === 'license') {
                setValue('category', 'general', { shouldDirty: true });
              }
            }}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              deliveryType === 'download_only'
                ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30 shadow-sm'
                : 'border-border/70 hover:border-emerald-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FaFileArchive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">İndirilebilir Dosya</h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Kurulum Paketi / Arşiv</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Satın alma sonrasında müşteri kurulum dosyasını (.exe, .zip, .dmg vb.) doğrudan sunucudan veya harici linkten indirir.
            </p>
          </div>

          {/* Card 3: Hibrit */}
          <div
            onClick={() => setDeliveryType('hybrid')}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              deliveryType === 'hybrid'
                ? 'border-indigo-500/80 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30 shadow-sm'
                : 'border-border/70 hover:border-indigo-500/40 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FaBox className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">Hibrit (Dosya + Lisans)</h4>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Yazılım + Doğrulama Keyi</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Müşteri hem kurulum paketini indirir hem de yazılımı kullanabilmek için benzersiz bir lisans anahtarı teslim alır.
            </p>
          </div>
        </div>
      </div>

      {/* 4. LİSANS DOĞRULAMA VE AKTİVASYON AYARLARI (Lisans veya Hibrit Modunda) */}
      {(deliveryType === 'license_only' || deliveryType === 'hybrid') && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-foreground">
                Lisans Doğrulama ve Aktivasyon Ayarları
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
              Otomatik Anahtar Üretimi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Lisans Tipi *</label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="admin-input text-xs"
              >
                <option value="ONE_TIME">Tek Seferlik (ONE_TIME)</option>
                <option value="PERPETUAL">Süresiz / Ömür Boyu (PERPETUAL)</option>
                <option value="SUBSCRIPTION">Dönemsel / Yenilenen (SUBSCRIPTION)</option>
                <option value="TRIAL">Deneme Lisansı (TRIAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Maksimum Aktivasyon (Cihaz Limiti) *</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxActivations}
                onChange={(e) => setMaxActivations(Math.max(1, Number(e.target.value) || 1))}
                className="admin-input text-xs"
                placeholder="1"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">Kaç cihaz veya kurulumda doğrulanabilir</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Geçerlilik Süresi (Gün)</label>
              <input
                type="number"
                min={0}
                value={validityDays}
                onChange={(e) => setValidityDays(Math.max(0, Number(e.target.value) || 0))}
                className="admin-input text-xs"
                placeholder="0 (Süresiz)"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">0 = Süresiz, 365 = 1 Yıl</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Uygulama Kodu / App ID (Ayırıcı Kimlik)
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="admin-input text-xs font-mono"
                placeholder={watch('slug') || 'app-a'}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Uygulamanızın API doğrulamasında göndereceği kod (Örn: <code>app-a</code>). B uygulaması ile lisansların karışmasını engeller.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">3. Parti / Harici Uygulama Adı</label>
              <input
                type="text"
                value={thirdPartyAppName}
                onChange={(e) => setThirdPartyAppName(e.target.value)}
                className="admin-input text-xs"
                placeholder="Örn: Desktop POS Client, Excel Fatura Eklentisi..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Harici İndirme / Mağaza URL (Opsiyonel)</label>
              <input
                type="url"
                value={externalAppUrl}
                onChange={(e) => setExternalAppUrl(e.target.value)}
                className="admin-input text-xs"
                placeholder="https://github.com/.../releases veya https://play.google.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Müşteri Aktivasyon Talimatı</label>
            <textarea
              rows={2}
              value={activationInstructions}
              onChange={(e) => setActivationInstructions(e.target.value)}
              className="admin-input text-xs resize-y"
              placeholder="Örn: Uygulamanızı açın, Ayarlar > Lisans menüsüne gidin ve satın aldığınız lisans anahtarını yapıştırarak 'Aktifleştir' butonuna tıklayın."
            />
          </div>

          {/* Süre ve Fiyat Paketleri (Tiers) */}
          <div className="pt-3 border-t border-amber-500/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FaCoins className="text-amber-500" />
                  <span>Süre ve Fiyat Paketleri (Dönemsel Lisanslama / Tiers)</span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Müşterinin seçebileceği farklı süre ve fiyat alternatifleri (Örn: 30 Gün 1.000 TL, 60 Gün 1.800 TL, 365 Gün vb.)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyStandardTiersTemplate}
                  className="px-2.5 py-1 text-xs rounded-lg border border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium transition-colors"
                  title="30 Gün, 60 Gün, 365 Gün ve Süresiz şablonunu otomatik yükler"
                >
                  ⚡ Hızlı Şablon Doldur
                </button>
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                >
                  <FaPlus className="w-3 h-3" />
                  Paket Ekle
                </button>
              </div>
            </div>

            {pricingTiers.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center">
                <p className="text-xs text-muted-foreground">
                  Henüz özel bir süre/fiyat paketi eklenmedi. Ürünün ana fiyatı ({formatTry(watch('priceCents') || 0)}) tek seçenek olarak geçerli olacaktır.
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  Birden fazla süre seçeneği sunmak için <strong>&quot;Paket Ekle&quot;</strong> veya <strong>&quot;Hızlı Şablon Doldur&quot;</strong> butonunu kullanabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pricingTiers.map((tier, idx) => (
                  <div
                    key={tier.id || idx}
                    className="p-3 rounded-xl border border-border/80 bg-background/90 flex flex-wrap items-center gap-3 shadow-xs"
                  >
                    {/* Süre */}
                    <div className="w-28 shrink-0">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Süre (Gün)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={tier.days}
                        onChange={(e) =>
                          updatePricingTier(idx, 'days', Math.max(0, Number(e.target.value) || 0))
                        }
                        className="admin-input text-xs py-1.5"
                        placeholder="30"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {tier.days === 0 ? '♾️ Süresiz' : `${tier.days} gün`}
                      </span>
                    </div>

                    {/* Fiyat (TL) */}
                    <div className="w-32 shrink-0">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Fiyat (TL)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={Math.round(tier.priceCents / 100)}
                        onChange={(e) =>
                          updatePricingTier(
                            idx,
                            'priceCents',
                            Math.max(0, Number(e.target.value) * 100)
                          )
                        }
                        className="admin-input text-xs py-1.5 font-semibold text-emerald-600 dark:text-emerald-400"
                        placeholder="1000"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {formatTry(tier.priceCents)}
                      </span>
                    </div>

                    {/* Paket Başlığı */}
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Paket Başlığı
                      </label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updatePricingTier(idx, 'label', e.target.value)}
                        className="admin-input text-xs py-1.5"
                        placeholder="Örn: 30 Günlük Lisans"
                      />
                    </div>

                    {/* Açıklama */}
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Kısa Not / Avantaj
                      </label>
                      <input
                        type="text"
                        value={tier.description || ''}
                        onChange={(e) => updatePricingTier(idx, 'description', e.target.value)}
                        className="admin-input text-xs py-1.5"
                        placeholder="Örn: %10 Avantajlı"
                      />
                    </div>

                    {/* Popüler Checkbox */}
                    <div className="flex items-center gap-1.5 pt-4 shrink-0">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.isPopular || false}
                          onChange={(e) => updatePricingTier(idx, 'isPopular', e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-amber-600"
                        />
                        <span>Popüler</span>
                      </label>
                    </div>

                    {/* Sil Butonu */}
                    <div className="pt-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => removePricingTier(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Bu paketi sil"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <FaInfoCircle className="text-brand-primary" />
              <span>3. Parti Uygulama Doğrulama API Uç Noktası</span>
            </div>
            <p className="text-muted-foreground">
              3. parti uygulamanız veya scriptleriniz bu anahtarları canlı doğrulamak için şu endpoint&apos;e POST isteği atabilir:
            </p>
            <div className="font-mono text-[11px] p-2 rounded bg-black/5 dark:bg-black/40 text-foreground overflow-x-auto select-all">
              POST /api/v1/licenses/verify &nbsp; · &nbsp; Body: &#123; &quot;key&quot;: &quot;NOKT-XXXX-XXXX-XXXX-XXXX&quot;, &quot;activate&quot;: true &#125;
            </div>
          </div>
        </div>
      )}

      {/* 5. AI Açıklama */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Açıklamalar</label>
          <button
            type="button"
            onClick={() => setAiOpen(!aiOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] text-sm rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            aria-expanded={aiOpen}
            aria-label="AI ile açıklama oluştur"
          >
            <span aria-hidden="true">✨</span>
            <span>AI ile Açıklama Oluştur</span>
          </button>
        </div>

        {aiOpen && (
          <div className="mb-3 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="ai-product-name" className="block text-sm font-medium mb-1">Ürün adı</label>
                <input
                  id="ai-product-name"
                  value={aiProductName}
                  onChange={(e) => setAiProductName(e.target.value)}
                  placeholder="örn: Next.js SaaS Starter"
                  className="admin-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ai-features" className="block text-sm font-medium mb-1">Özellikler (virgülle)</label>
                <input
                  id="ai-features"
                  value={aiFeatures}
                  onChange={(e) => setAiFeatures(e.target.value)}
                  placeholder="örn: TypeScript, Prisma, Auth, PayTR"
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="ai-variant" className="block text-sm font-medium mb-1">Uzunluk</label>
                <select
                  id="ai-variant"
                  value={aiVariant}
                  onChange={(e) => setAiVariant(e.target.value as typeof aiVariant)}
                  className="admin-input"
                >
                  <option value="short">Kısa</option>
                  <option value="medium">Orta</option>
                  <option value="long">Uzun</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAiDescribe}
                  disabled={aiLoading}
                  aria-busy={aiLoading}
                  className="admin-btn admin-btn-primary w-full"
                >
                  {aiLoading ? 'Oluşturuluyor...' : 'Açıklama Üret'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium mb-2">Kısa Açıklama (10-300 karakter) *</label>
            <textarea
              {...register('shortDescription', { required: 'Kısa açıklama zorunludur', minLength: 10, maxLength: 300 })}
              id="shortDescription"
              rows={2}
              className="admin-input resize-y min-h-[60px]"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">Detaylı Açıklama (min 50 karakter) *</label>
            <textarea
              {...register('description', { required: 'Açıklama zorunludur', minLength: 50 })}
              id="description"
              rows={6}
              className="admin-input resize-y min-h-[140px]"
            />
          </div>
        </div>
      </div>

      {/* 6. Dosya Yükleme / İndirme Alanı */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            {deliveryType === 'license_only'
              ? 'Yazılım / İndirme Bilgisi'
              : 'Ürün Dosyası (Yazılım / Kurulum Paketi) *'}
          </label>
          {deliveryType !== 'license_only' && (
            <button
              type="button"
              onClick={() => setShowManualUrl(!showManualUrl)}
              className="text-xs text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              <FaLink className="w-3 h-3" />
              {showManualUrl ? 'Dosya Yükleme Moduna Dön' : 'Harici İndirme URL Gir'}
            </button>
          )}
        </div>

        {/* Gizli file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          accept=".zip,.exe,.msi,.dmg,.pkg,.rar,.tar.gz,.7z,.tar,.gz,.json,.pdf,.bin"
        />

        {deliveryType === 'license_only' ? (
          <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <FaKey className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">Sanal Ürün Modu — Dosya Yükleme Gerekmez</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sipariş tamamlandığında müşteriye otomatik lisans doğrulama anahtarı üretilecek ve dashboard ile e-postaya iletilecektir.
                  {externalAppUrl ? ` Harici indirme: ${externalAppUrl}` : ''}
                </p>
              </div>
            </div>
            {fileUrl && (
              <button
                type="button"
                onClick={() => {
                  setValue('fileUrl', '', { shouldDirty: true });
                  setValue('fileName', '', { shouldDirty: true });
                  setValue('fileSize', 0, { shouldDirty: true });
                }}
                className="text-xs text-rose-500 hover:underline shrink-0"
              >
                Yüklü Dosyayı Temizle
              </button>
            )}
          </div>
        ) : !showManualUrl ? (
          <div>
            {fileUrl ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FaFileArchive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{fileName || 'Yüklenen Dosya'}</p>
                      <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBytes(fileSize)} · <span className="font-mono text-[11px] truncate">{fileUrl}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="admin-btn text-xs px-3 py-1.5"
                  >
                    Dosyayı Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('fileUrl', '', { shouldDirty: true });
                      setValue('fileName', '', { shouldDirty: true });
                      setValue('fileSize', 0, { shouldDirty: true });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Dosyayı kaldır"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-brand-primary bg-brand-primary/5 cursor-wait'
                    : 'border-border/80 hover:border-brand-primary hover:bg-muted/30'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaSpinner className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="font-medium text-sm">Dosya sunucuya yükleniyor...</p>
                    <p className="text-xs text-muted-foreground">Lütfen işlem tamamlanana kadar bekleyin.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-1">
                      <FaCloudUploadAlt className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm">
                      Masaüstü uygulaması veya kurulum paketini yüklemek için tıklayın ya da sürükleyin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desteklenen formatlar: .exe, .msi, .dmg, .pkg, .zip, .rar, .tar.gz (Maks. 500 MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4">
            <p className="text-xs text-muted-foreground">
              Harici depolama (AWS S3, Google Drive, Cloudflare R2 veya GitHub Releases) linki kullanıyorsanız doğrudan bilgileri girin:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fileUrl" className="block text-xs font-medium mb-1">Dosya URL *</label>
                <input
                  {...register('fileUrl')}
                  id="fileUrl"
                  className="admin-input text-xs"
                  placeholder="https://.../setup.exe"
                />
              </div>
              <div>
                <label htmlFor="fileName" className="block text-xs font-medium mb-1">Dosya Adı *</label>
                <input
                  {...register('fileName')}
                  id="fileName"
                  className="admin-input text-xs"
                  placeholder="Uygulama-v1.0.exe"
                />
              </div>
              <div>
                <label htmlFor="fileSize" className="block text-xs font-medium mb-1">Boyut (bytes)</label>
                <input
                  type="number"
                  {...register('fileSize', { valueAsNumber: true, min: 0 })}
                  id="fileSize"
                  className="admin-input text-xs"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hidden inputs to satisfy react-hook-form state */}
        <input type="hidden" {...register('fileUrl')} />
        <input type="hidden" {...register('fileName')} />
        <input type="hidden" {...register('fileSize')} />
      </div>

      {/* 7. Kategori, Versiyon ve Sıralama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Kategori *
          </label>
          <select
            {...register('category', { required: 'Kategori zorunlu' })}
            id="category"
            className="admin-input"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} — {cat.description}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-rose-600 mt-1">{errors.category.message as string}</p>
          )}
        </div>
        <div>
          <label htmlFor="version" className="block text-sm font-medium mb-2">Versiyon</label>
          <input {...register('version')} id="version" className="admin-input" placeholder="1.0.0" />
        </div>
        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-2">Sıralama</label>
          <input type="number" {...register('order', { valueAsNumber: true })} id="order" className="admin-input" />
        </div>
      </div>

      {/* 8. İndirme Limiti & TTL (Sadece indirme modlarında) */}
      {deliveryType !== 'license_only' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label htmlFor="downloadCountMax" className="block text-sm font-medium mb-2">İndirme Limiti</label>
            <input type="number" {...register('downloadCountMax', { valueAsNumber: true })} id="downloadCountMax" className="admin-input" />
          </div>
          <div>
            <label htmlFor="ttlHours" className="block text-sm font-medium mb-2">Link Geçerlilik (saat)</label>
            <input type="number" {...register('ttlHours', { valueAsNumber: true })} id="ttlHours" className="admin-input" />
          </div>
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('active')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
              <span>Aktif</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
              <span>Öne Çıkan</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
            <span>Aktif</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
            <span>Öne Çıkan</span>
          </label>
        </div>
      )}

      {/* 9. Butonlar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-border/60">
        <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary order-2 sm:order-1">
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="admin-btn admin-btn-primary order-1 sm:order-2"
        >
          {isSubmitting ? 'Kaydediliyor...' : isEditMode ? 'Değişiklikleri Kaydet' : 'Ürünü Oluştur'}
        </button>
      </div>
    </form>
  );
}
