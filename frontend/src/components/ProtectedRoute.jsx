import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const stored = localStorage.getItem('user');
        const parsed = stored && stored !== 'undefined' ? JSON.parse(stored) : null;
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;

  return children;
}