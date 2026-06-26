import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  Coins,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Sparkles,
  Tag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Link, NavLink, Outlet, useMatch } from 'react-router';
import {
  AccountMenu,
  SidebarAccountMenu,
} from '@/components/shared/account-menu';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', to: '/', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Money',
    items: [
      { title: 'Expenses', to: '/expenses', icon: Receipt },
      { title: 'Incomes', to: '/incomes', icon: TrendingUp },
      { title: 'Essentials', to: '/essentials', icon: Wallet },
      { title: 'Budgets', to: '/budgets', icon: PiggyBank },
    ],
  },
  {
    label: 'Manage',
    items: [
      { title: 'Categories', to: '/categories', icon: Tag },
      { title: 'Currency rates', to: '/rates', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Assistant',
    items: [{ title: 'AI Chat', to: '/ai-chat', icon: Sparkles }],
  },
];

const activeLinkClass =
  'data-active:bg-gradient-to-r data-active:from-sidebar-primary data-active:to-primary data-active:text-sidebar-primary-foreground data-active:shadow-sm data-active:shadow-sidebar-primary/30 data-active:font-medium data-active:hover:text-sidebar-primary-foreground';

export function AppShell() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className='h-svh overflow-hidden'>
        <AppTopbar />
        <main className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:gap-6 md:p-6'>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link to='/'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20'>
                  <Coins className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>Rinciku</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    Personal finance
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className='text-[0.65rem] font-medium tracking-wider uppercase'>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarAccountMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavItem({ item }: { item: NavItem }) {
  const match = useMatch({ path: item.to, end: item.end ?? false });

  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled aria-disabled='true' tooltip={item.title}>
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
        {item.badge ? (
          <SidebarMenuBadge className='bg-sidebar-primary/15 text-sidebar-primary'>
            {item.badge}
          </SidebarMenuBadge>
        ) : null}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={!!match}
        tooltip={item.title}
        className={activeLinkClass}
      >
        <NavLink to={item.to} end={item.end}>
          <item.icon />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
      {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

function AppTopbar() {
  return (
    <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar px-4 backdrop-blur-sm'>
      <SidebarTrigger />
      <Separator orientation='vertical' className='mr-2 h-4' />
      <div className='flex-1' />
      <ThemeToggle />
      <AccountMenu />
    </header>
  );
}
