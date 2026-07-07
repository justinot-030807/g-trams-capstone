import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    contact: '', // Pinalitan natin ito mula 'email' to 'contact'
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // I-save ang token at role sa browser memory
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        // I-redirect base sa role
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/operator-dashboard');
        }
      } else {
        setError(data.message || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Cannot connect to the server. Make sure backend is running.');
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-white border-2 border-[#D4AF37] shadow-md rounded-full flex items-center justify-center mx-auto mb-5 overflow-hidden">
   <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
</div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">G-TRAMS Portal</h2>
          <p className="text-sm text-slate-500 mt-1">Municipality of Gasan</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl p-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email or Phone Number</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="juan@gmail.com or 09123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="Enter your password"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-bold text-[#7A1B22] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#7A1B22] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#5A1419] hover:shadow-md active:scale-[0.98] transition-all duration-200 mt-2"
          >
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Unregistered operator?{' '}
          <Link to="/register" className="font-bold text-[#7A1B22] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;