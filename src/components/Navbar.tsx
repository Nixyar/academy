import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Menu, User as UserIcon, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Главная' },
  { path: '/free-landing', label: 'Vibe Landing' },
  { path: '/courses', label: 'Курсы' },
  { path: '/pricing', label: 'Тарифы' },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__logo">
            <Code2 size={18} />
          </span>
          <span className="navbar__title">
            VibeCoder<span className="accent">AI</span>
          </span>
        </Link>

        <div className="navbar__links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar__link ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/profile" className={`navbar__icon ${isActive('/profile') ? 'is-active' : ''}`}>
            <UserIcon size={18} />
          </Link>
        </div>

        <button className="navbar__toggle" onClick={() => setOpen(prev => !prev)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="navbar__mobile">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`navbar__mobile-link ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className={`navbar__mobile-link ${isActive('/profile') ? 'is-active' : ''}`}
          >
            Профиль
          </Link>
        </div>
      )}
    </nav>
  );
};
