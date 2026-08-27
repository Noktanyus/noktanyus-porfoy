import CardBody from '@/components/ui/CardBody';
import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface ModuleStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  details: {
    description?: string;
    error?: string;
  };
}

interface HealthResponse {
  status: string;
  timestamp: string;
  totalLatency: number;
  modules: ModuleStatus[];
}

async function getModuleStatus(): Promise<HealthResponse | null> {
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/health/modules`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

const moduleIcon: Record<string, string> = {
  content: 'Blog + Projeler',
  commerce: 'Mağaza + Ödeme',
  monitoring: 'Uptime + Status',
  messaging: 'İletişim + Newsletter',
};

export default async function HealthPage() {
  const data = await getModuleStatus();

  return (
    <main className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-12">
        <div className="text-center mb-12">
          <FaHeartbeat className="w-16 h-16 mx-auto text-primary mb-3" />
          <h1 className="text-4xl font-bold mb-2">Sistem Sağlığı</h1>
          <p className="text-muted-foreground">Tüm modüllerin durumu</p>
          {data && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Son kontrol: {new Date(data.timestamp).toLocaleString('tr-TR')} · Toplam{' '}
              {data.totalLatency}ms
            </p>
          )}
        </div>

        {data?.modules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {data.modules.map((m) => (
              <article
                key={m.name}
                className="glass-card-premium rounded-xl overflow-hidden"
              >
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {m.status === 'up' ? (
                        <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
                      ) : (
                        <FaTimesCircle className="text-red-500 text-2xl flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-semibold capitalize">
                          {moduleIcon[m.name] ?? m.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {m.details?.description ?? ''}
                        </p>
                        {m.details?.error && (
                          <p className="text-xs text-red-500 mt-1 font-mono break-all">
                            {m.details.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <p
                        className={`font-mono font-bold ${
                          m.status === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </p>
                      <p className="text-muted-foreground">{m.latency}ms</p>
                    </div>
                  </div>
                </CardBody>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Sağlık durumu şu an yüklenemedi. Lütfen daha sonra tekrar deneyin.
          </p>
        )}

        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground">
            JSON API: <code className="font-mono">/api/health</code> ·{' '}
            <code className="font-mono">/api/health/modules</code>
          </p>
        </div>
      </div>
    </main>
  );
}
