import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { formatMinutes } from '../utils/format.js';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isMentor = user.role === 'mentor';

  const [data, setData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyLesson, setBusyLesson] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null); // { id, url, title }
  const fileInputRef = useRef(null);

  const loadCourse = useCallback(async () => {
    const res = await api.get(`/courses/${id}`);
    setData(res.data);
  }, [id]);

  const loadMaterials = useCallback(async () => {
    const res = await api.get(`/courses/${id}/materials`);
    setMaterials(res.data.materials);
  }, [id]);

  useEffect(() => {
    Promise.all([loadCourse(), loadMaterials()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadCourse, loadMaterials]);

  // Revoke any object URL when unmounting to avoid leaks.
  useEffect(() => () => {
    if (viewing?.url) URL.revokeObjectURL(viewing.url);
  }, [viewing]);

  const enroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      setNotice('Enrolled! You can start completing lessons.');
      await loadCourse();
    } catch (err) {
      setError(err.message);
    }
  };

  const completeLesson = async (lesson) => {
    setBusyLesson(lesson.id);
    setError('');
    try {
      await api.post('/activities', {
        type: 'lesson_completed',
        courseId: id,
        lessonId: lesson.id,
        durationMinutes: lesson.estimatedMinutes,
      });
      await loadCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLesson(null);
    }
  };

  // Fetch the PDF as a blob (keeps the JWT auth header) and show it inline.
  const viewMaterial = async (mat) => {
    setError('');
    try {
      const res = await api.get(`/courses/${id}/materials/${mat.id}/file`, {
        responseType: 'blob',
      });
      if (viewing?.url) URL.revokeObjectURL(viewing.url);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setViewing({ id: mat.id, url, title: mat.title });
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadMaterial = async (mat) => {
    try {
      const res = await api.get(`/courses/${id}/materials/${mat.id}/file`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = mat.filename || `${mat.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    setUploading(true);
    setError('');
    setNotice('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name.replace(/\.pdf$/i, ''));
      await api.post(`/courses/${id}/materials`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNotice(`Uploaded "${file.name}".`);
      await loadMaterials();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (mat) => {
    setError('');
    try {
      await api.delete(`/courses/${id}/materials/${mat.id}`);
      if (viewing?.id === mat.id) {
        if (viewing.url) URL.revokeObjectURL(viewing.url);
        setViewing(null);
      }
      await loadMaterials();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner label="Loading course…" />;
  if (error && !data) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { course, enrollment, lessons } = data;
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct = course.totalLessons ? Math.round((completedCount / course.totalLessons) * 100) : 0;

  return (
    <div>
      <Link to="/courses" className="muted" style={{ fontSize: '0.9rem' }}>
        ← Back to courses
      </Link>

      {notice && <div className="alert alert-success mt">{notice}</div>}
      {error && <div className="alert alert-error mt">{error}</div>}

      {/* Course header */}
      <div className="card card-pad mt">
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span
              className="course-dot"
              style={{ background: course.color, width: 16, height: 16 }}
            />
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>{course.title}</h1>
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                <span className={`badge badge-${course.difficulty}`}>{course.difficulty}</span>
                <span className="chip">{course.category}</span>
                <span className="chip">{formatMinutes(course.estimatedMinutes)}</span>
              </div>
            </div>
          </div>
          {!isMentor && !enrollment && (
            <button className="btn btn-primary" onClick={enroll}>
              Enroll
            </button>
          )}
          {isMentor && <span className="chip">Viewing as mentor</span>}
        </div>

        <p className="muted mt">{course.description}</p>

        {!isMentor && enrollment && (
          <div className="mt">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                {completedCount}/{course.totalLessons} lessons · {pct}% complete
              </span>
              <span className={`badge badge-${enrollment.status}`}>{enrollment.status}</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${pct}%`, background: course.color }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Course materials (PDF) */}
      <div className="card card-pad mt">
        <div className="card-header">
          <div>
            <div className="card-title">Course materials</div>
            <div className="card-subtitle">
              {isMentor ? 'Upload PDFs for your students' : 'PDF resources from your mentor'}
            </div>
          </div>
          {isMentor && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onFileSelected}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={onUploadClick}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : '⬆ Upload PDF'}
              </button>
            </>
          )}
        </div>

        {materials.length === 0 ? (
          <div className="empty">
            {isMentor ? 'No materials yet — upload a PDF to get started.' : 'No materials yet.'}
          </div>
        ) : (
          materials.map((m) => (
            <div className="material-item" key={m.id}>
              <span className="material-icon" aria-hidden="true">PDF</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {m.filename}
                  {m.size ? ` · ${formatBytes(m.size)}` : ''}
                </div>
              </div>
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => viewMaterial(m)}>
                  View
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => downloadMaterial(m)}>
                  Download
                </button>
                {isMentor && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => deleteMaterial(m)}
                    title="Delete"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Inline PDF viewer */}
        {viewing && (
          <div className="mt">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{viewing.title}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  URL.revokeObjectURL(viewing.url);
                  setViewing(null);
                }}
              >
                ✕ Close
              </button>
            </div>
            <iframe className="pdf-frame" src={viewing.url} title={viewing.title} />
          </div>
        )}
      </div>

      {/* Lessons */}
      <h2 style={{ fontSize: '1.15rem', margin: '22px 0 12px' }}>Lessons</h2>
      {lessons.map((lesson) => (
        <div className="lesson-item" key={lesson.id}>
          <span className={`lesson-check ${lesson.completed ? 'done' : ''}`}>
            {lesson.completed ? '✓' : lesson.order}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{lesson.title}</div>
            <div className="muted" style={{ fontSize: '0.82rem' }}>
              {lesson.summary} · {formatMinutes(lesson.estimatedMinutes)}
            </div>
          </div>
          {isMentor ? (
            <span className={`badge badge-${lesson.difficulty}`}>{lesson.difficulty}</span>
          ) : enrollment ? (
            lesson.completed ? (
              <span className="badge badge-completed">Done</span>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => completeLesson(lesson)}
                disabled={busyLesson === lesson.id}
              >
                {busyLesson === lesson.id ? 'Saving…' : 'Mark complete'}
              </button>
            )
          ) : (
            <span className="chip">Enroll to start</span>
          )}
        </div>
      ))}
    </div>
  );
}
