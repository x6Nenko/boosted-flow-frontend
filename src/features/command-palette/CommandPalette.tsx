import { Command } from 'cmdk';
import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCommandPaletteOpen, useCommandRegistry, useRegisterCommand } from './hooks';
import type { CommandDefinition } from './command-registry';
import { commandPaletteStore } from './command-palette-store';
import { useAuth } from '@/features/auth/hooks/use-auth';

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="ml-auto text-xs text-gray-400">{children}</kbd>;
}

export function CommandPalette() {
  const isOpen = useCommandPaletteOpen();
  const navigate = useNavigate();
  const commands = useCommandRegistry();
  const { isAuthenticated } = useAuth();

  const close = () => commandPaletteStore.close();

  const runAndClose = (fn: () => void) => {
    close();
    window.setTimeout(fn, 0);
  };

  // Authenticated navigation commands
  const dashboardCommand = useMemo(
    () => ({
      id: 'nav.dashboard',
      group: 'Navigation',
      label: 'Go to Dashboard',
      shortcut: 'G → D',
      run: () => navigate({ to: '/dashboard' }),
    }),
    [navigate]
  );

  const activitiesCommand = useMemo(
    () => ({
      id: 'nav.activities',
      group: 'Navigation',
      label: 'Go to Activities',
      shortcut: 'G → A',
      run: () => navigate({ to: '/activities' }),
    }),
    [navigate]
  );

  const analyticsCommand = useMemo(
    () => ({
      id: 'nav.analytics',
      group: 'Navigation',
      label: 'Go to Analytics',
      shortcut: 'G → N',
      run: () => navigate({ to: '/analytics' }),
    }),
    [navigate]
  );

  // Guest navigation commands
  const loginCommand = useMemo(
    () => ({
      id: 'nav.login',
      group: 'Navigation',
      label: 'Go to Login',
      run: () => navigate({ to: '/login' }),
    }),
    [navigate]
  );

  const registerCommand = useMemo(
    () => ({
      id: 'nav.register',
      group: 'Navigation',
      label: 'Go to Register',
      run: () => navigate({ to: '/register' }),
    }),
    [navigate]
  );

  const homeCommand = useMemo(
    () => ({
      id: 'nav.home',
      group: 'Navigation',
      label: 'Go to Home',
      run: () => navigate({ to: '/' }),
    }),
    [navigate]
  );

  // Register commands based on authentication state (unconditionally call hooks)
  useRegisterCommand(isAuthenticated ? dashboardCommand : null);
  useRegisterCommand(isAuthenticated ? activitiesCommand : null);
  useRegisterCommand(isAuthenticated ? analyticsCommand : null);
  useRegisterCommand(!isAuthenticated ? homeCommand : null);
  useRegisterCommand(!isAuthenticated ? loginCommand : null);
  useRegisterCommand(!isAuthenticated ? registerCommand : null);

  const groupedCommands = useMemo(() => {
    const groups = new Map<string, CommandDefinition[]>();
    commands.forEach((command) => {
      if (!groups.has(command.group)) {
        groups.set(command.group, []);
      }
      groups.get(command.group)?.push(command);
    });
    return Array.from(groups.entries());
  }, [commands]);

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? commandPaletteStore.open() : close())}
      label="Command Palette"
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-content"
    >
      <Command.Input placeholder="Type a command..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        {groupedCommands.map(([group, items]) => (
          <Command.Group key={group} heading={group}>
            {items.map((command) => (
              <Command.Item key={command.id} onSelect={() => runAndClose(command.run)}>
                {command.label}
                {command.shortcut && <Kbd>{command.shortcut}</Kbd>}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
