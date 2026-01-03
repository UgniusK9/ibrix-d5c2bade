import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Neteisingas el. pašto formatas');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, signInWithMagicLink } = useAuth();
  
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setSending(true);
    
    try {
      const { error } = await signInWithMagicLink(email);
      
      if (error) {
        if (error.message.includes('rate limit')) {
          setError('Per daug bandymų. Palaukite ir bandykite dar kartą.');
        } else {
          setError('Įvyko klaida. Bandykite dar kartą.');
        }
        toast.error('Nepavyko išsiųsti nuorodos');
      } else {
        setSent(true);
        toast.success('Prisijungimo nuoroda išsiųsta!');
      }
    } catch (e) {
      setError('Įvyko klaida. Bandykite dar kartą.');
    } finally {
      setSending(false);
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

  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="font-heading text-2xl font-bold mb-2">
                  Patikrinkite el. paštą
                </h1>
                <p className="text-muted-foreground mb-6">
                  Išsiuntėme prisijungimo nuorodą į <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Neradote? Patikrinkite spam aplanką arba{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-primary hover:underline"
                  >
                    bandykite dar kartą
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-heading text-2xl font-bold mb-2">
                    Prisijungimas
                  </h1>
                  <p className="text-muted-foreground">
                    Įveskite el. paštą ir gaukite prisijungimo nuorodą
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">El. paštas</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jusu@pastas.lt"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      disabled={sending}
                      className="mt-1"
                    />
                    {error && (
                      <p className="text-sm text-destructive mt-1">{error}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sending || !email.trim()}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Siunčiama...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Gauti prisijungimo nuorodą
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground mt-6">
                  Prisijungdami sutinkate su{' '}
                  <a href="/taisykles" className="text-primary hover:underline">
                    naudojimosi taisyklėmis
                  </a>{' '}
                  ir{' '}
                  <a href="/privatumo-politika" className="text-primary hover:underline">
                    privatumo politika
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
