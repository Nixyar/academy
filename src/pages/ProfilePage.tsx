import React from 'react';
import { courses } from '@/data/courses';

const user = {
  name: 'Alex Coder',
  email: 'alex@vibecoder.ai',
  isPro: true,
  streak: 12,
  xp: 4500,
};

export const ProfilePage: React.FC = () => (
  <section className="section">
    <div className="container profile">
      <div className="profile__card">
        <div className="avatar">AC</div>
        <div>
          <h3>{user.name} <span className="chip">AI PRO</span></h3>
          <p className="muted">{user.email}</p>
          <div className="profile__stats">
            <div>
              <p className="label">AI Стрик</p>
              <h4>{user.streak} 🔥</h4>
            </div>
            <div>
              <p className="label">Vibe очки</p>
              <h4>{user.xp}</h4>
            </div>
          </div>
        </div>
      </div>

      <h4 className="profile__title">Синхронизация прогресса</h4>
      <div className="profile__progress">
        {courses.map(course => (
          <div key={course.id} className="progress-card">
            <div className="progress-card__icon" style={{ background: course.gradient }}>
              {course.tech}
            </div>
            <div className="progress-card__body">
              <h5>{course.title}</h5>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: '45%' }} />
              </div>
            </div>
            <span className="progress-card__value">45%</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);
