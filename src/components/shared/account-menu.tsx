import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';

function initialFor(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const source = name?.trim() || email?.trim() || '';
  return source.charAt(0).toUpperCase() || '?';
}

interface AccountData {
  displayName: string | null;
  email: string;
  initial: string;
  handleSignOut: () => Promise<void>;
}

function useAccountData(): AccountData | null {
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

  return {
    displayName,
    email,
    initial: initialFor(displayName, email),
    handleSignOut,
  };
}

function AccountMenuItems({
  account,
}: {
  account: Pick<AccountData, 'displayName' | 'email' | 'handleSignOut'>;
}) {
  return (
    <>
      <DropdownMenuLabel className='flex flex-col gap-0.5 py-2'>
        {account.displayName ? (
          <span className='text-sm font-medium text-foreground'>
            {account.displayName}
          </span>
        ) : null}
        <span className='truncate text-xs text-muted-foreground'>
          {account.email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to='/account'>
          <Settings />
          <span>Settings</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem variant='destructive' onSelect={account.handleSignOut}>
        <LogOut />
        <span>Sign out</span>
      </DropdownMenuItem>
    </>
  );
}

export function AccountMenu() {
  const account = useAccountData();
  if (!account) return null;

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
            <AvatarFallback>{account.initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-56'>
        <AccountMenuItems account={account} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarAccountMenu() {
  const account = useAccountData();
  const { isMobile } = useSidebar();
  if (!account) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              tooltip={account.displayName ?? account.email}
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar size='sm' className='rounded-lg'>
                <AvatarFallback className='rounded-lg'>
                  {account.initial}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                {account.displayName ? (
                  <span className='truncate font-medium'>
                    {account.displayName}
                  </span>
                ) : null}
                <span className='truncate text-xs text-muted-foreground'>
                  {account.email}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <AccountMenuItems account={account} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
