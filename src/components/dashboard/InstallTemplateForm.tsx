/**
 * @file Dashboard — Template Install Form (client component)
 * @description Phase 3 B.3: Kullanıcının seçtiği workspace'e template'i kur.
 *
 *              Form:
 *                - workspaceId (select — sadece OWNER olanlar)
 *                - subdomain (opsiyonel)
 *                - primaryColor (color picker, opsiyonel)
 *
 *              POST /api/templates/[slug]/install
 *                Body: { licenseKey, workspaceId, config: { subdomain, primaryColor } }
 *                Response: { installationId, status, deployedUrl? }
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FaRocket, FaSpinner } from 'react-icons/fa';

interface InstallTemplateFormProps {
  licenseKey: string;
  templateSlug: string;
  templateName: string;
  workspaces: Array<{ id: string; name: string; slug: string }>;
  alreadyLinkedWorkspaceId?: string;
}

interface FormValues {
  workspaceId: string;
  subdomain: string;
  primaryColor: string;
}

const DEFAULT_COLOR = '#3B82F6';

export function InstallTemplateForm({
  licenseKey,
  templateSlug,
  templateName,
  workspaces,
  alreadyLinkedWorkspaceId,
}: InstallTemplateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      workspaceId: alreadyLinkedWorkspaceId ?? workspaces[0]?.id ?? '',
      subdomain: '',
      primaryColor: DEFAULT_COLOR,
    },
  });

  const primaryColor = watch('primaryColor');

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const loadingId = toast.loading('Kurulum başlatılıyor...');
    try {
      const config: Record<string, string> = {};
      if (data.subdomain.trim()) config.subdomain = data.subdomain.trim().toLowerCase();
      if (data.primaryColor) config.primaryColor = data.primaryColor;

      const response = await fetch(`/api/templates/${templateSlug}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          workspaceId: data.workspaceId,
          config,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result?.error?.message ?? 'Kurulum başarısız');
      }

      toast.success(
        result.data?.deployedUrl
          ? `Kurulum hazır: ${result.data.deployedUrl}`
          : 'Kurulum kuyruğa eklendi. Durum yukarıda görünecek.',
        { id: loadingId, duration: 6000 }
      );
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-card-premium p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <FaRocket className="w-4 h-4 text-brand-primary" />
        <h3 className="text-base font-semibold">Şimdi Kur</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>{templateName}</strong> template'ini seçtiğin workspace'e kur.
      </p>

      <div>
        <label htmlFor="workspaceId" className="block text-sm font-medium mb-1">
          Workspace *
        </label>
        <select
          id="workspaceId"
          {...register('workspaceId', { required: 'Workspace seçmelisin' })}
          className="admin-input"
          disabled={!!alreadyLinkedWorkspaceId}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} (/{w.slug})
            </option>
          ))}
        </select>
        {errors.workspaceId && (
          <p className="text-xs text-red-500 mt-1">{errors.workspaceId.message}</p>
        )}
        {alreadyLinkedWorkspaceId && (
          <p className="text-xs text-muted-foreground mt-1">
            Lisans zaten bir workspace'e bağlı. Kurulum orada yapılır.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subdomain" className="block text-sm font-medium mb-1">
          Subdomain (opsiyonel)
        </label>
        <input
          id="subdomain"
          {...register('subdomain', {
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: 'Sadece küçük harf, rakam ve tire',
            },
            maxLength: { value: 32, message: 'En fazla 32 karakter' },
          })}
          className="admin-input"
          placeholder="ornek-site"
        />
        {errors.subdomain && (
          <p className="text-xs text-red-500 mt-1">{errors.subdomain.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="primaryColor" className="block text-sm font-medium mb-1">
          Birincil Renk
        </label>
        <div className="flex items-center gap-2">
          <input
            id="primaryColor"
            type="color"
            {...register('primaryColor')}
            value={primaryColor}
            className="h-10 w-14 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
          />
          <code className="text-xs font-mono text-muted-foreground">
            {primaryColor}
          </code>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="admin-btn admin-btn-primary w-full"
      >
        {submitting ? (
          <>
            <FaSpinner className="inline w-3 h-3 animate-spin mr-2" />
            Kuruluyor...
          </>
        ) : (
          <>
            <FaRocket className="inline w-3 h-3 mr-2" />
            Kur
          </>
        )}
      </button>
    </form>
  );
}

export default InstallTemplateForm;
