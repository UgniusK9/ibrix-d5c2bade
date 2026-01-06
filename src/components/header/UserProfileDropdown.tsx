import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Package, 
  Heart, 
  Gift, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  first_name: string | null;
  last_name: string | null;
}

export function UserProfileDropdown() {
  const { t } = useTranslation();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserData(data);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name[0]}${userData.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    if (userData?.first_name) {
      return userData.first_name;
    }
    return user?.email?.split('@')[0] || t('header.account');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
            {getDisplayName()}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border z-50">
        {/* User info header */}
        <div className="px-3 py-2 border-b border-border">
          <p className="font-medium text-sm truncate">{getDisplayName()}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link to="/account" className="flex items-center gap-3 cursor-pointer">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{t('account.myAccount')}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/orders" className="flex items-center gap-3 cursor-pointer">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{t('account.myOrders')}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/wishlist" className="flex items-center gap-3 cursor-pointer">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span>{t('account.wishlist')}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/account/credits" className="flex items-center gap-3 cursor-pointer">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <span>{t('account.rewards')}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/account/settings" className="flex items-center gap-3 cursor-pointer">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>{t('account.settings')}</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-3 cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>{t('header.admin')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('auth.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
