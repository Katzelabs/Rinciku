import { LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';

function initialFor(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const source = name?.trim() || email?.trim() || '';
  return source.charAt(0).toUpperCase() || '?';
}

export function AccountMenu() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Failed to sign out', error);
      toast.error('Could not sign you out. Please try again.');
      return;
    }
    navigate('/sign-in', { replace: true });
  }

  if (!user) return null;

  const displayName = profile?.display_name?.trim() || null;
  const email = user.email ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full'
          aria-label='Open account menu'
        >
          <Avatar size='sm'>
            <AvatarFallback>{initialFor(displayName, email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-56'>
        <DropdownMenuLabel className='flex flex-col gap-0.5 py-2'>
          {displayName ? (
            <span className='text-sm font-medium text-foreground'>
              {displayName}
            </span>
          ) : null}
          <span className='truncate text-xs text-muted-foreground'>
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/account'>
            <Settings />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant='destructive' onSelect={handleSignOut}>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
