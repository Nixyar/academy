import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { CoursesPage } from '@/pages/CoursesPage';
import { PricingPage } from '@/pages/PricingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LessonPage } from '@/pages/LessonPage';
import { FreeLandingPage } from '@/pages/FreeLandingPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import '@/styles/index.scss';

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/free-landing" element={<FreeLandingPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<LessonPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default App;
