import React, { useState } from 'react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button';
import { 
  User, 
  Phone, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  Users,
  HardHat,
  Building2
} from 'lucide-react';

export function RegisterPage() {
  const { register, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'USER',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    { id: 'USER', label: 'Customer / Business', icon: Users, desc: 'Book verified artisans with escrow protection' },
    { id: 'WORKER', label: 'Worker / Shramik', icon: HardHat, desc: '100% direct payouts, zero middleman cut' },
    { id: 'COOPERATIVE', label: 'Cooperative Society', icon: Building2, desc: 'Manage member roster & welfare fund' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await register({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
        role: formData.role,
      });

      const targetPath = getRoleDashboardPath(newUser.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-grid-pattern">
      <div className="gov-tricolor-stripe fixed top-0 left-0 right-0 z-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center mb-4">
          <Link to="/">
            <Logo size="lg" showTagline={true} />
          </Link>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-navy-900 font-display">
          Create Your ShramSetu Account
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
          Join India’s cooperative-owned digital labour marketplace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl">
          
          {/* Error Banner */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = formData.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-saffron-600' : 'text-slate-500'}`} />
                      <div>
                        <span className={`block text-xs font-bold ${isSelected ? 'text-brand-saffron-950' : 'text-slate-800'}`}>
                          {r.label.split('/')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{r.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name / Society Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rajeshwar Shinde"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone and Email in two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98201 44019"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full py-3"
                icon={isSubmitting ? Loader2 : ArrowRight}
              >
                {isSubmitting ? 'Registering...' : `Join as ${formData.role}`}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-saffron-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
