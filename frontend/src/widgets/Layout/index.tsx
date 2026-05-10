import { NavLink, Outlet } from 'react-router-dom';
import { DebugPanel } from '@/shared/ui/DebugPanel';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/wallets', label: 'Wallets' },
  { to: '/lotteries', label: 'Lotteries' },
  { to: '/tickets', label: 'Tickets' },
];

export const Layout = () => {
  return (
    <div className="app-shell">
      <header className="header">
        <h1>TON Lottery</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <DebugPanel />
    </div>
  );
};
