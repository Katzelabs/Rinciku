import type { LucideIcon } from 'lucide-react';
import {
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { title: 'Expenses', to: '/expenses', icon: Receipt },
  { title: 'Incomes', to: '/incomes', icon: TrendingUp },
  { title: 'Essentials', to: '/essentials', icon: Wallet },
  { title: 'Categories', to: '/categories', icon: Tag },
  { title: 'Budgets', to: '/budgets', icon: PiggyBank },
];

const comingSoonItems: Pick<NavItem, 'title' | 'icon'>[] = [
  { title: 'AI Chat', icon: Sparkles },
];

const activeLinkClass =
  'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground';

export function AppShell() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <main className='flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6'>
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
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Coming soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {comingSoonItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    disabled
                    aria-disabled='true'
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarAccountMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavItem({ item }: { item: NavItem }) {
  const match = useMatch({ path: item.to, end: item.end ?? false });
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
    </SidebarMenuItem>
  );
}

function AppTopbar() {
  return (
    <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4'>
      <SidebarTrigger />
      <Separator orientation='vertical' className='mr-2 h-4' />
      <div className='flex-1' />
      <AccountMenu />
    </header>
  );
}
