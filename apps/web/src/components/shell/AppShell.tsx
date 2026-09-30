import { Outlet } from 'react-router-dom';
import { useLiveSync } from '../../hooks/useLiveSync';
import { BottomBar } from './BottomBar';
import { ConnectionBanner } from './ConnectionBanner';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';

/** Control-room frame: banner · top bar · nav rail | content · live strip. */
export function AppShell() {
  useLiveSync();
  return (
    <div className="flex h-full flex-col">
      <ConnectionBanner />
      <div className="grid min-h-0 flex-1 grid-cols-[48px_1fr] grid-rows-[40px_1fr_28px]">
        <TopBar />
        <NavRail />
        <main className="min-h-0 min-w-0 overflow-auto">
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  );
}
