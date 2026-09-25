import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';
import { CommunityComment } from '../types';

interface CommunityCommentsSectionProps {
  targetId: string;
  targetName?: string;
  category: 'phone' | 'pc' | 'soc';
  title?: string;
  subtitle?: string;
}

export const CommunityCommentsSection: React.FC<CommunityCommentsSectionProps> = ({
  targetId,
  targetName,
  category,
  title,
  subtitle
}) => {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Form states
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [commentTitle, setCommentTitle] = useState('');
  const [content, setContent] = useState('');
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch comments when targetId changes
  useEffect(() => {
    if (!targetId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/comments?targetId=${encodeURIComponent(targetId)}&category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      })
      .catch((err) => console.warn('[Comments] Error fetching comments:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId, category]);

  const handleLike = async (commentId: string) => {
    if (likedMap[commentId]) return;

    setLikedMap((prev) => ({ ...prev, [commentId]: true }));
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1, userLiked: true } : c))
    );

    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
    } catch {
      // optimistic
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const pros = prosInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const cons = consInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          category,
          author: author.trim(),
          rating,
          title: commentTitle.trim() || 'Opinión de la Comunidad',
          content: content.trim(),
          pros,
          cons
        })
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowForm(false);
          setAuthor('');
          setCommentTitle('');
          setContent('');
          setProsInput('');
          setConsInput('');
          setRating(5);
        }, 1500);
      }
    } catch (err: any) {
      console.error('[Comments] Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Average rating computation
  const avgRating = comments.length > 0
    ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
    : '5.0';

  return (
    <div className="bg-[#141822] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              {title || 'COMENTARIOS Y OPINIONES DE LA COMUNIDAD'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {targetName ? `Experiencias con ${targetName}` : 'Opiniones y Comentarios Verificados'}
          </h3>
          <p className="text-xs text-slate-400">
            {subtitle || 'Reseñas reales de usuarios, pruebas térmicas y rendimiento en el día a día.'}
          </p>
        </div>

        {/* Rating summary & Add review button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-[#1C2230] px-3 py-1.5 rounded-xl border border-slate-700">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-white">{avgRating}</span>
            <span className="text-[10px] text-slate-400">({comments.length} comentarios)</span>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showForm ? 'Cerrar' : 'Dejar Comentario'}</span>
          </button>
        </div>
      </div>

      {/* New Comment Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#181F2C] border border-cyan-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Escribir Comentario u Opinión
            </h4>
            <span className="text-[10px] text-slate-400">Tu opinión ayuda a otros compradores</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tu Nombre o Apodo *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="ej: Marcos G. o TechBuilder"
                className="w-full px-3 py-2 bg-[#121620] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Valoración General
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-300 ml-2">{rating} de 5 estrellas</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Título del Comentario
            </label>
            <input
              type="text"
              value={commentTitle}
              onChange={(e) => setCommentTitle(e.target.value)}
              placeholder="ej: Rendimiento térmico impecable y gran fluidez"
              className="w-full px-3 py-2 bg-[#121620] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tu Comentario o Análisis Detallado *
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comparte tu experiencia: rendimiento en juegos, temperaturas bajo carga, estabilidad o consejos de configuración..."
              className="w-full px-3 py-2 bg-[#121620] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Aspectos Positivos (Pros) - separados por coma
              </label>
              <input
                type="text"
                value={prosInput}
                onChange={(e) => setProsInput(e.target.value)}
                placeholder="ej: Bajas temperaturas, Gran autonomía, 1% Lows estables"
                className="w-full px-3 py-2 bg-[#121620] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Aspectos a Mejorar (Contras) - separados por coma
              </label>
              <input
                type="text"
                value={consInput}
                onChange={(e) => setConsInput(e.target.value)}
                placeholder="ej: Precio algo alto, Requiere buena ventilación"
                className="w-full px-3 py-2 bg-[#121620] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {submitSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Comentario publicado exitosamente!</span>
              </div>
            ) : <span />}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publicando...' : 'Publicar Comentario'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando comentarios y opiniones de la comunidad...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aún no hay comentarios para este elemento. ¡Sé el primero en compartir tu experiencia!
          </div>
        ) : (
          comments.map((c) => {
            const hasLiked = likedMap[c.id] || c.userLiked;
            return (
              <div
                key={c.id}
                className="bg-[#181E2B] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3 transition-all hover:border-slate-700"
              >
                {/* Author row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs uppercase">
                      {c.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.author}</span>
                        {c.badge && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{c.date}</span>
                    </div>
                  </div>

                  {/* Rating stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= c.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title & Content */}
                <div>
                  <h4 className="text-xs font-bold text-white leading-snug">{c.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                    {c.content}
                  </p>
                </div>

                {/* Pros and Cons badges if any */}
                {((c.pros && c.pros.length > 0) || (c.cons && c.cons.length > 0)) && (
                  <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                    {c.pros?.map((pro, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      >
                        ✓ {pro}
                      </span>
                    ))}
                    {c.cons?.map((con, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30"
                      >
                        ✕ {con}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom row: Likes */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">Experiencia Verificada</span>

                  <button
                    onClick={() => handleLike(c.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      hasLiked
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#141822] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-cyan-300' : ''}`} />
                    <span>Útil ({c.likes})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
