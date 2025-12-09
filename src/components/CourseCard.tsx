import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '@/types';

interface Props {
  course: Course;
}

export const CourseCard: React.FC<Props> = ({ course }) => (
  <Link to={`/courses/${course.id}`} className="course-card">
    <div className="course-card__image" style={{ backgroundImage: `url(${course.image})` }}>
      <span className="course-card__tag" style={{ background: course.gradient }}>
        {course.tech}
      </span>
    </div>
    <div className="course-card__body">
      <div className="course-card__meta">
        <span className="chip" style={{ color: course.accent }}>
          {course.level}
        </span>
        <span className="muted">{course.lessons.length} модулей</span>
      </div>
      <h3>{course.title}</h3>
      <p className="muted">{course.description}</p>
    </div>
  </Link>
);
