import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface Props {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ children }) => (
  <div className="app">
    <Navbar />
    <main className="content">{children ?? <Outlet />}</main>
    <Footer />
  </div>
);
