import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/services/authContext';

export const AuthCallbackPage: React.FC = () => {
  const { handleAuthCallback, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    handleAuthCallback().finally(() => navigate('/profile', { replace: true }));
  }, [handleAuthCallback, navigate]);

  return (
    <section className="section">
      <div className="container">
        <h3>Подключаем аккаунт...</h3>
        {loading && <p className="muted">Завершаем вход через Google</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
};
