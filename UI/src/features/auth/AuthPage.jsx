import React, { useState } from 'react';
import { httpClient } from '../../api/httpClient';
import './auth.css';

export function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Пожалуйста, заполните все поля');
      }

      if (!validateEmail(formData.email)) {
        throw new Error('Пожалуйста, введите корректный email');
      }

      if (formData.password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
      }

      const response = await httpClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setSuccess('Регистрация успешна! Теперь войдите в свой аккаунт');
      setFormData({ name: '', email: '', password: '' });
      setTimeout(() => {
        setIsLogin(true);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Пожалуйста, заполните все поля');
      }

      if (!validateEmail(formData.email)) {
        throw new Error('Пожалуйста, введите корректный email');
      }

      const response = await httpClient.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { accessToken, user } = response.data;
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Устанавливаем токен в заголовок по умолчанию
      httpClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setSuccess('Вы успешно вошли!');
      setFormData({ name: '', email: '', password: '' });
      
      setTimeout(() => {
        onAuthSuccess(user);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? '🔐 Вход' : '📝 Регистрация'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Введите ваши учетные данные' 
              : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
          {!isLogin && (
            <div className="form-group-auth">
              <label className="form-label-auth">Имя</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-control-auth"
                placeholder="Ваше имя"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group-auth">
            <label className="form-label-auth">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-control-auth"
              placeholder="example@mail.com"
              disabled={loading}
            />
          </div>

          <div className="form-group-auth">
            <label className="form-label-auth">Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-control-auth"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading 
              ? (isLogin ? 'Вход...' : 'Регистрация...') 
              : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-toggle-text">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="auth-toggle-btn"
              disabled={loading}
            >
              {isLogin ? 'Зарегистрируйтесь' : 'Войдите'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
