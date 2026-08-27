'use client';

/**
 * VideoRoom — WebRTC stub UI
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * Gercek peer connection signaling server gerektirir; burada
 * - getUserMedia ile local video preview
 * - mic/cam/screen toggle UI
 * - participant grid placeholder
 * - join/leave API entegrasyonu
 * saglar.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaVideo, FaMicrophone, FaPhoneSlash, FaDesktop, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface VideoCallData {
  id: string;
  title: string;
  description?: string | null;
  roomCode: string;
  status: string;
  durationMin: number;
  maxParticipants: number;
  host: { id: string; name?: string | null; image?: string | null };
}

export function VideoRoom({ call }: { call: VideoCallData }) {
  const router = useRouter();
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [needsJoinForm, setNeedsJoinForm] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // WebRTC getUserMedia stub - local preview only, peer connection yok
  const startLocalMedia = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (err) {
      // Izin yoksa sessizce devam et (kullanici UI'dan acabilir)
      console.warn('Camera/mic not accessible', err);
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopLocalMedia();
  }, [stopLocalMedia]);

  const handleJoin = async () => {
    if (!guestName.trim()) {
      toast.error('Lütfen isminizi girin');
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`/api/video-calls/${call.roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Katılım başarısız');
      setJoined(true);
      setNeedsJoinForm(false);
      setParticipantCount((c) => c + 1);
      await startLocalMedia();
      toast.success('Toplantıya katıldınız');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Katılım başarısız');
    } finally {
      setJoining(false);
    }
  };

  const toggleVideo = async () => {
    const stream = streamRef.current;
    if (!stream) {
      await startLocalMedia();
      return;
    }
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOn(track.enabled);
    }
  };

  const toggleAudio = () => {
    const stream = streamRef.current;
    if (!stream) {
      void startLocalMedia();
      return;
    }
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioOn(track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      toast('Ekran paylaşımı durduruldu (demo)');
      return;
    }
    // Gercek implementation icin getDisplayMedia + signaling gerekir.
    // Stub: sadece UI toggle.
    setIsScreenSharing(true);
    toast.success('Ekran paylaşımı başlatıldı (demo)');
  };

  const handleEnd = () => {
    if (!confirm('Toplantıdan çıkmak istediğinize emin misiniz?')) return;
    stopLocalMedia();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div>
          <h1 className="text-lg font-bold">{call.title}</h1>
          <p className="text-sm text-gray-400">
            Oda: <code className="font-mono">{call.roomCode}</code> · Durum: {call.status}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FaUser className="w-4 h-4" />
          <span>{participantCount} katılımcı</span>
        </div>
      </header>

      {/* Join Form (guest veya initial katilim) */}
      {needsJoinForm && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Toplantıya Katıl</h2>
            <p className="text-sm text-gray-400">
              {call.description ?? 'Bu toplantıya katılmak için bilgilerinizi girin.'}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="guest-name">
                İsim *
              </label>
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                placeholder="Adınız Soyadınız"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="guest-email">
                Email (opsiyonel)
              </label>
              <input
                id="guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                placeholder="ornek@mail.com"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
              type="button"
            >
              {joining ? 'Katılınıyor...' : 'Katıl'}
            </button>
          </div>
        </div>
      )}

      {/* Active Room */}
      {joined && (
        <>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            <div className="bg-gray-800 rounded-lg aspect-video relative overflow-hidden flex items-center justify-center border border-gray-700">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <FaUser className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-500">Kamera kapalı</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-medium">
                Sen ({guestName || 'Misafir'})
              </div>
              {!isAudioOn && (
                <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-xs font-medium">
                  🔇 Sessiz
                </div>
              )}
            </div>

            {/* Participant placeholders */}
            {Array.from({ length: Math.min(participantCount - 1, 5) }).map((_, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center border border-gray-700"
              >
                <div className="text-center">
                  <FaUser className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-400">Katılımcı {idx + 1}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <footer className="bg-gray-800 p-4 flex items-center justify-center gap-3 border-t border-gray-700">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              type="button"
              aria-label={isAudioOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
              title={isAudioOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
            >
              <FaMicrophone className="w-5 h-5" />
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              type="button"
              aria-label={isVideoOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
              title={isVideoOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
            >
              <FaVideo className="w-5 h-5" />
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              type="button"
              aria-label="Ekran paylaşımı"
              title="Ekran paylaşımı"
            >
              <FaDesktop className="w-5 h-5" />
            </button>
            <button
              onClick={handleEnd}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              type="button"
              aria-label="Toplantıdan ayrıl"
              title="Toplantıdan ayrıl"
            >
              <FaPhoneSlash className="w-5 h-5" />
            </button>
          </footer>

          <div className="bg-blue-900/30 border-t border-blue-700 p-2 text-center text-xs text-blue-200">
            ℹ️ Video calls demo mode - gerçek WebRTC peer connection için signaling server gerekir
          </div>
        </>
      )}
    </div>
  );
}

export default VideoRoom;