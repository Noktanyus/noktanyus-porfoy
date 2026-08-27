'use client';

/**
 * TaskBoard — Kanban-style görev panosu.
 * 4 sütun (todo / in_progress / review / done), drag-drop ile status değişimi.
 * Yeni task oluşturma, assignee atama, due date, priority destekli.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaPlus,
  FaClock,
  FaUser,
  FaFlag,
  FaTimes,
  FaCheck,
  FaTrash,
  FaComment,
} from 'react-icons/fa';

interface Assignee {
  userId: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  tags?: string[];
  assignees: Assignee[];
  createdBy?: { id: string; name: string | null };
  _count?: { comments: number; subtasks: number };
}

interface Member {
  id: string;
  name: string;
}

const COLUMNS = [
  { id: 'todo', label: 'Yapılacak', color: 'bg-gray-500' },
  { id: 'in_progress', label: 'Devam Eden', color: 'bg-blue-500' },
  { id: 'review', label: 'İncelemede', color: 'bg-yellow-500' },
  { id: 'done', label: 'Tamamlandı', color: 'bg-green-500' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

export function TaskBoard({
  workspaceId,
  workspaceName,
  members,
}: {
  workspaceId: string;
  workspaceName: string;
  members: Member[];
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`);
      const data = await res.json();
      if (data.success) setTasks(data.data.tasks);
      else toast.error('Görevler yüklenemedi');
    } catch {
      toast.error('Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDrop = async (status: string) => {
    if (!draggedTaskId) return;
    const taskId = draggedTaskId;
    setDraggedTaskId(null);
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error('Status güncellenemedi');
        fetchTasks();
      }
    } catch {
      toast.error('Status güncellenemedi');
      fetchTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Silinemedi');
      toast.success('Görev silindi');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    }
  };

  const filteredTasks =
    filter === 'mine'
      ? tasks.filter((t) =>
          t.assignees.some((a) => a.userId === (window as any).__currentUserId)
        )
      : tasks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Görevler</h1>
          <p className="text-sm text-muted-foreground">{workspaceName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-border/50">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm ${filter === 'all' ? 'bg-brand-primary text-white' : 'bg-muted/30'}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1.5 text-sm ${filter === 'mine' ? 'bg-brand-primary text-white' : 'bg-muted/30'}`}
            >
              Bana Atanan
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="admin-btn admin-btn-primary"
          >
            <FaPlus /> Yeni Görev
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card-premium p-12 text-center text-sm text-muted-foreground">
          Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="glass-card-premium p-4 min-h-[420px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.id)}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground ml-auto bg-muted/40 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Bu sütunda görev yok
                    </p>
                  )}
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          workspaceId={workspaceId}
          members={members}
          onClose={() => setShowCreate(false)}
          onCreated={(task) => {
            setTasks((prev) => [task as Task, ...prev]);
            setShowCreate(false);
            toast.success('Görev oluşturuldu');
          }}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
  onDelete,
}: {
  task: Task;
  onDragStart: () => void;
  onDelete: () => void;
}) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done' &&
    task.status !== 'cancelled';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-background/80 backdrop-blur rounded-lg border border-border/50 cursor-move hover:shadow-md hover:border-brand-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm flex-1 break-words">{task.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          title="Sil"
        >
          <FaTrash className="w-3 h-3" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
        <span
          className={`inline-flex items-center gap-1 ${
            PRIORITY_COLORS[task.priority] ?? 'text-gray-500'
          }`}
          title={`Öncelik: ${PRIORITY_LABELS[task.priority] ?? task.priority}`}
        >
          <FaFlag className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">{PRIORITY_LABELS[task.priority] ?? task.priority}</span>
        </span>

        {task.dueDate && (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            <FaClock className="inline w-2.5 h-2.5 mr-1" />
            {formatDate(task.dueDate)}
          </span>
        )}

        {(task._count?.comments ?? 0) > 0 && (
          <span>
            <FaComment className="inline w-2.5 h-2.5 mr-1" />
            {task._count?.comments}
          </span>
        )}

        <div className="ml-auto flex items-center -space-x-1">
          {task.assignees.slice(0, 3).map((a) => (
            <span
              key={a.userId}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-semibold border border-background"
              title={a.user.name ?? a.user.email}
            >
              {(a.user.name ?? a.user.email).charAt(0).toUpperCase()}
            </span>
          ))}
          {task.assignees.length > 3 && (
            <span className="text-[10px]">+{task.assignees.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({
  workspaceId,
  members,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  members: Member[];
  onClose: () => void;
  onCreated: (task: unknown) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Başlık zorunlu');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          dueDate: dueDate || undefined,
          assigneeIds,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Oluşturulamadı');
      onCreated(data.data.task);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-premium p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Yeni Görev</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input w-full"
              placeholder="Görev başlığı"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-input w-full min-h-[80px]"
              placeholder="Görev detayları..."
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="admin-input w-full"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="admin-input w-full"
              />
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Atanan Kişiler
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg max-h-32 overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      assigneeIds.includes(m.id)
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-background border-border hover:border-brand-primary/40'
                    }`}
                  >
                    {assigneeIds.includes(m.id) && <FaCheck className="inline w-2.5 h-2.5 mr-1" />}
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn"
              disabled={submitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}