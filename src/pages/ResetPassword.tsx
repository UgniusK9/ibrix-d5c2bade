import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.string().min(6, 'Slaptažodis turi būti bent 6 simbolių');

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, isLoading } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      newErrors.password = passResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'Slaptažodžiai nesutampa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        toast.error('Nepavyko pakeisti slaptažodžio. Bandykite dar kartą.');
      } else {
        setSuccess(true);
        toast.success('Slaptažodis sėkmingai pakeistas!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (e) {
      toast.error('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (success) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-card border border-border rounded-xl p-6 shadow-premium text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="font-heading text-xl font-bold mb-2">
                Slaptažodis pakeistas!
              </h1>
              <p className="text-sm text-muted-foreground">
                Nukreipiame į pagrindinį puslapį...
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-xl p-6 shadow-premium">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-heading text-xl font-bold">Naujas slaptažodis</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Įveskite naują slaptažodį
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm">Naujas slaptažodis</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm" className="text-sm">Pakartokite slaptažodį</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                  disabled={loading}
                  className="mt-1.5"
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive mt-1">{errors.confirm}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Keičiama...
                  </>
                ) : (
                  'Pakeisti slaptažodį'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}