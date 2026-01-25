import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRegisterCommand, useRegisterCommands } from './hooks';
import { commandRegistry, type CommandDefinition } from './command-registry';

afterEach(() => {
  commandRegistry.get().forEach((command) => commandRegistry.unregister(command.id));
});

describe('useRegisterCommand', () => {
  it('registers command on mount and unregisters on unmount', () => {
    const command: CommandDefinition = {
      id: 'test.command',
      group: 'Test',
      label: 'Test Command',
      run: () => { },
    };

    const { unmount } = renderHook(() => useRegisterCommand(command));

    expect(commandRegistry.get()).toEqual([command]);

    unmount();

    expect(commandRegistry.get()).toEqual([]);
  });

  it('handles null command', () => {
    renderHook(() => useRegisterCommand(null));
    expect(commandRegistry.get()).toEqual([]);
  });
});

describe('useRegisterCommands', () => {
  it('registers multiple commands on mount and unregisters on unmount', () => {
    const commands: CommandDefinition[] = [
      { id: 'test.1', group: 'Test', label: 'Command 1', run: () => { } },
      { id: 'test.2', group: 'Test', label: 'Command 2', run: () => { } },
      { id: 'test.3', group: 'Test', label: 'Command 3', run: () => { } },
    ];

    const { unmount } = renderHook(() => useRegisterCommands(commands));

    expect(commandRegistry.get()).toEqual(commands);

    unmount();

    expect(commandRegistry.get()).toEqual([]);
  });

  it('handles empty array', () => {
    renderHook(() => useRegisterCommands([]));
    expect(commandRegistry.get()).toEqual([]);
  });

  it('re-registers when commands array changes', () => {
    const initialCommands: CommandDefinition[] = [
      { id: 'test.1', group: 'Test', label: 'Command 1', run: () => { } },
    ];

    const updatedCommands: CommandDefinition[] = [
      { id: 'test.2', group: 'Test', label: 'Command 2', run: () => { } },
      { id: 'test.3', group: 'Test', label: 'Command 3', run: () => { } },
    ];

    const { rerender } = renderHook(
      ({ commands }) => useRegisterCommands(commands),
      { initialProps: { commands: initialCommands } }
    );

    expect(commandRegistry.get()).toEqual(initialCommands);

    rerender({ commands: updatedCommands });

    expect(commandRegistry.get()).toEqual(updatedCommands);
  });
});
