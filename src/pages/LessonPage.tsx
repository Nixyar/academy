import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Cpu, Play } from 'lucide-react';
import { courses } from '@/data/courses';
import { Sandbox } from '@/components/Sandbox';
import { Lesson } from '@/types';

export const LessonPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = useMemo(() => courses.find(item => item.id === courseId), [courseId]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [courseId]);

  if (!course) {
    return <div className="section"><div className="container"><p className="muted">Данные не найдены в базе VibeCoder.</p></div></div>;
  }

  const activeLesson: Lesson | undefined = course.lessons[index];

  if (!activeLesson) {
    return null;
  }

  return (
    <div className="lesson">
      <header className="lesson__header" style={{ background: course.gradient }}>
        <div className="lesson__breadcrumbs">
          <Link to="/courses" className="back">
            <ArrowRight size={16} className="rotate" /> Курсы
          </Link>
          <span>{course.title}</span>
        </div>
        <div className="lesson__meta">
          <span className="chip">Уровень {index + 1} / {course.lessons.length}</span>
          <span className="chip">{course.tech}</span>
        </div>
      </header>

      <div className="lesson__grid">
        <aside className="lesson__sidebar">
          <div className="media">
            <Play size={28} />
            <span>Видеоплейсхолдер</span>
          </div>
          <h3>{activeLesson.title}</h3>
          <p className="muted">{activeLesson.content}</p>

          <div className="mission-card">
            <div className="title">
              <Cpu size={16} /> Миссия
            </div>
            <p>{activeLesson.challenge}</p>
          </div>

          <div className="lesson__nav">
            <button
              className="btn btn-ghost"
              disabled={index === 0}
              onClick={() => setIndex(value => Math.max(0, value - 1))}
            >
              Назад
            </button>
            <button
              className="btn btn-primary"
              disabled={index === course.lessons.length - 1}
              onClick={() => setIndex(value => Math.min(course.lessons.length - 1, value + 1))}
            >
              Далее
            </button>
          </div>
        </aside>

        <div className="lesson__workspace">
          <Sandbox initialCode={activeLesson.initialCode} />
        </div>
      </div>
    </div>
  );
};
