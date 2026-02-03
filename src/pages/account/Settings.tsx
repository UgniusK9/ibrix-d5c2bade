import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, MapPin, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Trash2, Download, Shield, AtSign, Globe, Camera, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  avatar_url: string | null;
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
  const [emailCooldownUntil, setEmailCooldownUntil] = useState<number | null>(null);
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
    avatar_url: null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
          .select('first_name, last_name, email, country, username, collection_public, avatar_url')
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
            avatar_url: data.avatar_url || null,
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

    // Prevent repeated sends (provider rate limit) - only check if cooldown is active
    if (emailCooldownUntil && Date.now() < emailCooldownUntil) {
      const secondsLeft = Math.max(1, Math.ceil((emailCooldownUntil - Date.now()) / 1000));
      toast.error(t('settings.emailRateLimit', { seconds: secondsLeft }));
      return;
    }
    
    setSavingEmail(true);
    try {
      // First check if email is already registered in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail.toLowerCase().trim())
        .maybeSingle();
      
      if (existingUser) {
        toast.error(t('settings.emailAlreadyUsed'));
        setSavingEmail(false);
        return;
      }

      // Update email with proper redirect URL for confirmation
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.toLowerCase().trim() },
        { emailRedirectTo: `${window.location.origin}/account/settings` }
      );
      
      if (error) throw error;
      
      // Set cooldown AFTER successful send to prevent spam
      setEmailCooldownUntil(Date.now() + 30_000);
      setEmailSent(true);
      toast.success(t('settings.emailVerificationSent'));
    } catch (error: any) {
      console.error('Error changing email:', error);
      const msg: string = error?.message || '';
      // Example: "429: For security purposes, you can only request this after 11 seconds."
      const match = msg.match(/after\s+(\d+)\s+seconds/i);
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || match) {
        const seconds = match ? Number(match[1]) : 20;
        setEmailCooldownUntil(Date.now() + Math.max(5, seconds) * 1000);
        toast.error(t('settings.emailRateLimit', { seconds: Math.max(1, seconds) }));
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        toast.error(t('settings.emailAlreadyUsed'));
      } else if (msg.includes('same as')) {
        toast.error(t('settings.emailSameAsCurrent'));
      } else {
        toast.error(msg || t('common.error'));
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('settings.invalidImageType'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.imageTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success(t('settings.avatarUpdated'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('common.error'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile.avatar_url) return;

    setUploadingAvatar(true);
    try {
      // Delete from storage
      const oldPath = profile.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: null });
      toast.success(t('settings.avatarRemoved'));
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error(t('common.error'));
    } finally {
      setUploadingAvatar(false);
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
          {/* Avatar Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                {t('settings.avatar')}
              </CardTitle>
              <CardDescription>{t('settings.avatarDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {profile.avatar_url ? t('settings.changeAvatar') : t('settings.uploadAvatar')}
                  </Button>
                  {profile.avatar_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('settings.removeAvatar')}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">{t('settings.avatarHint')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
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