import React from 'react';
import { CourseCard } from '@/components/CourseCard';
import { courses } from '@/data/courses';

export const CoursesPage: React.FC = () => (
  <section className="section">
    <div className="container">
      <div className="section__header">
        <p className="eyebrow">Матрица курсов</p>
        <h2>Выбери свой путь развития</h2>
        <p className="muted">От основ до нейросетевых интеграций.</p>
      </div>
      <div className="courses-grid">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  </section>
);
