import { Command } from 'cmdk';
import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCommandPaletteOpen, useCommandRegistry, useRegisterCommand } from './hooks';
import type { CommandDefinition } from './command-registry';
import { commandPaletteStore } from './command-palette-store';

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="ml-auto text-xs text-gray-400">{children}</kbd>;
}

export function CommandPalette() {
  const isOpen = useCommandPaletteOpen();
  const navigate = useNavigate();
  const commands = useCommandRegistry();

  const close = () => commandPaletteStore.close();

  const runAndClose = (fn: () => void) => {
    close();
    window.setTimeout(fn, 0);
  };

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

  useRegisterCommand(dashboardCommand);
  useRegisterCommand(activitiesCommand);
  useRegisterCommand(analyticsCommand);

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
