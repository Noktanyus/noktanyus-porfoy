'use client';

import React, { useState, useMemo } from 'react';
import {
  compareShippingRates,
  ShippingDistance,
} from '@/modules/tr-api/shippingTierComparison';
import {
  FaTruck,
  FaBoxOpen,
  FaWeightHanging,
  FaGasPump,
  FaCheckCircle,
  FaCoins,
  FaRoute,
  FaTag,
  FaInfoCircle,
  FaArrowUp,
  FaPercent,
} from 'react-icons/fa';

export default function ShippingTierToolClient() {
  const [inputMode, setInputMode] = useState<'dimensions' | 'directDesi'>('dimensions');
  const [widthCm, setWidthCm] = useState<number>(30);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [customDesi, setCustomDesi] = useState<number>(3);
  const [actualWeightKg, setActualWeightKg] = useState<number>(2);
  const [distance, setDistance] = useState<ShippingDistance>('nearby');
  const [cashOnDelivery, setCashOnDelivery] = useState<boolean>(false);

  const applyPreset = (w: number, l: number, h: number, kg: number) => {
    setInputMode('dimensions');
    setWidthCm(w);
    setLengthCm(l);
    setHeightCm(h);
    setActualWeightKg(kg);
  };

  const result = useMemo(() => {
    return compareShippingRates({
      dimensions:
        inputMode === 'dimensions'
          ? { widthCm, lengthCm, heightCm }
          : undefined,
      customVolumetricDesi:
        inputMode === 'directDesi' ? customDesi : undefined,
      actualWeightKg,
      distance,
      cashOnDelivery,
    });
  }, [inputMode, widthCm, lengthCm, heightCm, customDesi, actualWeightKg, distance, cashOnDelivery]);

  return (
    <div className="space-y-8">
      {/* Parametre Giriş Paneli */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaTruck className="text-amber-400" />
              Çoklu Taşıyıcı Kargo Barem & Fiyat Karşılaştırma
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              En, boy, yükseklik ve ağırlıktan fatura matrah desisini hesaplayın, 8 kargo firmasının tahmini ücretlerini kıyaslayın.
            </p>
          </div>

          {/* Hızlı Koli Presetleri */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(25, 35, 2, 0.5)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Zarf / Tekstil (0.6 Desi)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(20, 15, 10, 1)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Küçük Koli (1 Desi)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30, 20, 15, 2.5)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Orta Koli (3 Desi)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(45, 35, 25, 6)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Büyük Koli (13 Desi)
            </button>
          </div>
        </div>

        {/* Giriş Modu Sekmeleri */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setInputMode('dimensions')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
              inputMode === 'dimensions'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <FaBoxOpen className="inline mr-1.5" /> Koli Ebatları (En × Boy × Yükseklik)
          </button>
          <button
            type="button"
            onClick={() => setInputMode('directDesi')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
              inputMode === 'directDesi'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <FaTag className="inline mr-1.5" /> Doğrudan Desi Gir
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {inputMode === 'dimensions' ? (
            <>
              {/* En */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  En (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Boy */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Boy (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Yükseklik */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Yükseklik (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          ) : (
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Hacimsel Desi Değeri
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={customDesi}
                onChange={(e) => setCustomDesi(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Fiili Ağırlık */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Fiili Ağırlık (kg)</span>
              <span className="text-[10px] text-slate-500">Tartı Ağırlığı</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.5"
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">kg</span>
            </div>
          </div>
        </div>

        {/* Mesafe ve Ek Hizmetler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <FaRoute className="text-amber-400" />
              Taşıma Mesafesi & Hat
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDistance('intracity')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  distance === 'intracity'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Şehir İçi (-%10)
              </button>
              <button
                type="button"
                onClick={() => setDistance('nearby')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  distance === 'nearby'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Yakın Hat (Standart)
              </button>
              <button
                type="button"
                onClick={() => setDistance('intercity')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  distance === 'intercity'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Uzak Hat (+%15)
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer w-full hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={cashOnDelivery}
                onChange={(e) => setCashOnDelivery(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">Kapıda Ödeme (Tahsilatlı Kargo)</span>
                <span className="text-slate-400 text-[11px]">Tahsilat hizmet bedeli (+18 TL) dahil edilir</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Özet ve Matrah Şeridi */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs text-slate-400 block">FATURA MATRAH DESİSİ</span>
            <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
              {result.chargeableDesi} Desi
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {result.matchedTier}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          <div>
            <span className="text-xs text-slate-400 block">HACİMSEL VS AĞIRLIK</span>
            <div className="text-sm font-semibold text-slate-200">
              {result.volumetricDesi} Desi / {result.actualWeightKg} kg{' '}
              <span className="text-xs font-normal text-slate-500">
                ({result.volumetricDesi >= result.actualWeightKg ? 'Hacim Esas Alındı' : 'Ağırlık Esas Alındı'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl text-emerald-300">
            <span className="text-slate-400 block text-[10px]">EN UCUZ FİYAT</span>
            <strong className="text-base font-bold">₺{result.cheapestCarrier.totalPrice.toFixed(2)}</strong>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 px-3 py-2 rounded-xl text-slate-300">
            <span className="text-slate-400 block text-[10px]">PİYASA ORTALAMASI</span>
            <strong className="text-base font-bold">₺{result.averageMarketPrice.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* 8 Kargo Taşıyıcı Fiyat Listesi */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center justify-between">
          <span>Kargo Firmaları Tahmini Fiyat Karşılaştırması</span>
          <span className="text-xs font-normal text-slate-400">Tüm fiyatlara KDV (%20) ve Akaryakıt Payı dahildir</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.quotes.map((q) => (
            <div
              key={`carrier-${q.carrierId}`}
              className={`rounded-2xl p-5 border transition flex flex-col justify-between ${
                q.isCheapest
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-sm">{q.carrierName}</h4>
                  {q.isCheapest && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <FaCheckCircle /> EN UCUZ
                    </span>
                  )}
                  {q.isMarketplaceIntegrated && !q.isCheapest && (
                    <span className="text-[10px] font-medium bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                      Pazaryeri
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-white tracking-tight">
                  ₺{q.totalEstimatedPriceInclVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span>Barem Baz Fiyat:</span>
                    <span className="text-slate-300">₺{q.baseFare.toFixed(2)}</span>
                  </div>
                  {q.fuelSurchargeAmount > 0 && (
                    <div className="flex justify-between text-amber-400/90">
                      <span>Akaryakıt Katkı (AKP):</span>
                      <span>+₺{q.fuelSurchargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {q.cashOnDeliveryFee > 0 && (
                    <div className="flex justify-between text-indigo-400">
                      <span>Kapıda Ödeme:</span>
                      <span>+₺{q.cashOnDeliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>KDV (%20):</span>
                    <span>₺{q.vatAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                {q.isMarketplaceIntegrated
                  ? 'Pazaryeri anlaşmalı gönderilerde geçerlidir.'
                  : 'Bireysel ve standart kurumsal liste baremidir.'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tavsiye ve Kâr Notu */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-start gap-4">
        <FaCoins className="text-amber-400 text-2xl mt-1 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Maliyet & Kâr Optimizasyonu Önerisi</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {result.recommendation}
          </p>
        </div>
      </div>

      {/* REST API Bilgi Notu */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <FaInfoCircle className="text-amber-400 text-base mt-0.5 shrink-0" />
        <div>
          <span className="text-slate-200 font-semibold">E-Ticaret Yazılımları & OMS için REST API:</span>{' '}
          Sepet sayfasında veya sipariş yönetim panelinde en uygun kargo maliyetini anlık sorgulamak için{' '}
          <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/shipping/rate-comparison
          </code>{' '}
          uç noktasını kullanabilirsiniz.
        </div>
      </div>
    </div>
  );
}
