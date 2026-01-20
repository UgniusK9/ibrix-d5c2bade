import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, MapPin, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Trash2, Download, Shield, AtSign, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  country: string | null;
  username: string;
  collection_public: boolean;
}

interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function Settings() {
  const { user, updatePassword, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');
  
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    country: null,
    username: '',
    collection_public: false,
  });
  
  const [address, setAddress] = useState<AddressData>({
    street: '',
    city: '',
    postalCode: '',
    country: 'LT',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, email, country, username, collection_public')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            country: data.country,
            username: data.username || '',
            collection_public: data.collection_public || false,
          });
          setNewEmail(data.email || '');
          setOriginalUsername(data.username || '');
        }
        
        const savedAddress = localStorage.getItem(`user_address_${user.id}`);
        if (savedAddress) {
          setAddress(JSON.parse(savedAddress));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Debounced username availability check
  useEffect(() => {
    // Skip check if username unchanged or empty
    if (!profile.username || profile.username === originalUsername) {
      setUsernameAvailable(null);
      return;
    }
    
    if (profile.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!usernameRegex.test(profile.username)) {
      setUsernameAvailable(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc('check_username_available', {
          check_username: profile.username
        });
        if (!error) {
          setUsernameAvailable(data === true);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [profile.username, originalUsername]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          country: profile.country,
          username: profile.username || null,
          collection_public: profile.collection_public,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      localStorage.setItem(`user_address_${user.id}`, JSON.stringify(address));
      
      toast.success(t('settings.saved'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !newEmail || newEmail === profile.email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error(t('settings.invalidEmail'));
      return;
    }
    
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast.success(t('settings.emailVerificationSent'));
    } catch (error: any) {
      console.error('Error changing email:', error);
      if (error.message?.includes('already registered')) {
        toast.error(t('settings.emailAlreadyUsed'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword.length < 8) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }
    
    setSavingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) throw error;
      
      setPasswordChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.passwordChanged'));
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
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
      <div className="container py-8 md:py-12 max-w-2xl">
        <Link 
          to="/account" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('settings.backToAccount')}
        </Link>

        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('settings.subtitle')}</p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {t('settings.personalInfo')}
              </CardTitle>
              <CardDescription>{t('settings.personalInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('authFlow.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder={t('authFlow.firstName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('authFlow.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder={t('authFlow.lastName')}
                  />
                </div>
              </div>

              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <AtSign className="w-4 h-4" />
                  {t('settings.username')}
                  <span className="text-muted-foreground font-normal text-sm">({t('common.optional')})</span>
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
                    placeholder="jonas_123"
                    maxLength={20}
                    className={`pr-10 ${
                      profile.username && profile.username !== originalUsername
                        ? usernameAvailable === true
                          ? 'border-green-500'
                          : usernameAvailable === false
                          ? 'border-destructive'
                          : ''
                        : ''
                    }`}
                  />
                  {checkingUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!checkingUsername && profile.username && profile.username !== originalUsername && profile.username.length >= 3 && usernameAvailable === true && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {!checkingUsername && profile.username && profile.username !== originalUsername && usernameAvailable === false && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{t('settings.usernameHint')}</p>
                {profile.username && profile.username !== originalUsername && usernameAvailable === false && (
                  <p className="text-destructive text-xs">{t('settings.usernameTaken')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {t('settings.privacy')}
              </CardTitle>
              <CardDescription>{t('settings.privacyDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collection-public" className="font-medium">
                    {t('settings.collectionPublic')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.collectionPublicDesc')}
                  </p>
                </div>
                <Switch
                  id="collection-public"
                  checked={profile.collection_public}
                  onCheckedChange={(checked) => setProfile({ ...profile, collection_public: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                {t('settings.email')}
              </CardTitle>
              <CardDescription>{t('settings.emailChangeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailSent ? (
                <Alert className="border-success/30 bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    {t('settings.emailVerificationSentDesc')}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="currentEmail">{t('settings.currentEmail')}</Label>
                    <Input
                      id="currentEmail"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">{t('settings.newEmail')}</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t('settings.newEmailPlaceholder')}
                    />
                  </div>
                  {newEmail && newEmail !== profile.email && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('settings.emailChangeNote')}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    onClick={handleChangeEmail}
                    disabled={savingEmail || !newEmail || newEmail === profile.email}
                    variant="outline"
                  >
                    {savingEmail ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {t('settings.changeEmail')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                {t('settings.password')}
              </CardTitle>
              <CardDescription>{t('settings.passwordChangeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordChanged ? (
                <Alert className="border-success/30 bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    {t('settings.passwordChangedDesc')}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('settings.passwordTooShort')}
                      </AlertDescription>
                    </Alert>
                  )}
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('settings.passwordMismatch')}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    onClick={handleChangePassword}
                    disabled={savingPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    variant="outline"
                  >
                    {savingPassword ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    {t('settings.changePassword')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t('settings.address')}
              </CardTitle>
              <CardDescription>{t('settings.addressDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">{t('settings.street')}</Label>
                <Input
                  id="street"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder={t('settings.streetPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder={t('settings.cityPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('settings.postalCode')}</Label>
                  <Input
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    placeholder={t('settings.postalCodePlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('authFlow.country')}</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="LT"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion Card */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                {t('settings.deleteAccount')}
              </CardTitle>
              <CardDescription>{t('settings.deleteAccountDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('settings.deleteAccountWarning')}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    // Export user data
                    try {
                      const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user?.id)
                        .single();
                      
                      const { data: ordersData } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('user_id', user?.id);
                      
                      const { data: wishlistData } = await supabase
                        .from('wishlists')
                        .select('*, products(title, sku)')
                        .eq('user_id', user?.id);
                      
                      const exportData = {
                        user: userData,
                        orders: ordersData,
                        wishlist: wishlistData,
                        exportedAt: new Date().toISOString(),
                      };
                      
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ibrix-data-export-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      toast.success(t('settings.dataExported'));
                    } catch (error) {
                      console.error('Error exporting data:', error);
                      toast.error(t('common.error'));
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('settings.exportData')}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('settings.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.deleteAccountConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.deleteAccountConfirmDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          try {
                            // Delete user data from public.users (cascade will handle related data)
                            const { error: deleteError } = await supabase
                              .from('users')
                              .delete()
                              .eq('id', user?.id);
                            
                            if (deleteError) throw deleteError;
                            
                            // Sign out and redirect
                            await signOut();
                            toast.success(t('settings.accountDeleted'));
                            navigate('/');
                          } catch (error) {
                            console.error('Error deleting account:', error);
                            toast.error(t('common.error'));
                          }
                        }}
                      >
                        {t('settings.confirmDelete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('settings.saveChanges')}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}