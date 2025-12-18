import React, { useEffect, useMemo } from 'react';
import { courses } from '@/data/courses';
import { useAuth } from '@/services/authContext';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const ProfilePage: React.FC = () => {
  const { user, loading, error, loginWithGoogle, logout, fetchProfile } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const progressByCourse = useMemo(
    () =>
      courses.map(course => ({
        ...course,
        progress: user?.progress?.[course.id] ?? 0,
      })),
    [user?.progress],
  );

  if (!user) {
    return (
      <section className="section">
        <div className="container profile">
          <div className="profile__card empty">
            <div>
              <p className="label">Авторизация</p>
              <h3>Зайди через Google, чтобы синхронизировать прогресс</h3>
              {error && <p className="error">{error}</p>}
              <div className="profile__actions">
                <button className="btn btn-primary" onClick={loginWithGoogle} disabled={loading}>
                  {loading ? 'Открываем Google...' : 'Войти через Google'}
                </button>
              </div>
              <p className="muted small">После входа данные сохранятся на бэкенде.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const dailyLeft = Math.max((user.dailyLimit ?? 0) - (user.dailyUsed ?? 0), 0);

  return (
    <section className="section">
      <div className="container profile">
        <div className="profile__card">
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <h3>
              {user.name} <span className="chip">{user.plan ?? 'FREE'}</span>
            </h3>
            <p className="muted">{user.email}</p>
            <div className="profile__stats">
              <div>
                <p className="label">Тариф</p>
                <h4 className="muted">{user.plan ?? 'free'}</h4>
              </div>
              <div>
                <p className="label">Дневной лимит</p>
                <h4>
                  {user.dailyUsed ?? 0}/{user.dailyLimit ?? 0}
                  <span className="muted"> · осталось {dailyLeft}</span>
                </h4>
              </div>
              <div>
                <p className="label">Доступ</p>
                <h4>{user.isSubscribed ? 'PRO' : 'Free'}</h4>
              </div>
            </div>
            <div className="profile__actions">
              <button className="btn btn-ghost" onClick={logout} disabled={loading}>
                Выйти
              </button>
            </div>
          </div>
        </div>

        <h4 className="profile__title">Синхронизация прогресса</h4>
        <div className="profile__progress">
          {progressByCourse.map(course => (
            <div key={course.id} className="progress-card">
              <div className="progress-card__icon" style={{ background: course.gradient }}>
                {course.tech}
              </div>
              <div className="progress-card__body">
                <h5>{course.title}</h5>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              <span className="progress-card__value">{course.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
