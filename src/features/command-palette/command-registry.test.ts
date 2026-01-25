import { afterEach, describe, expect, it } from 'vitest';
import { commandRegistry, type CommandDefinition } from './command-registry';

afterEach(() => {
  commandRegistry.get().forEach((command) => commandRegistry.unregister(command.id));
});

describe('commandRegistry', () => {
  it('registers and unregisters commands', () => {
    const command: CommandDefinition = {
      id: 'test.command',
      group: 'Test',
      label: 'Test Command',
      run: () => { },
    };

    const unregister = commandRegistry.register(command);

    expect(commandRegistry.get()).toEqual([command]);

    unregister();

    expect(commandRegistry.get()).toEqual([]);
  });

  it('replaces commands with the same id', () => {
    const first: CommandDefinition = {
      id: 'test.replace',
      group: 'Test',
      label: 'First',
      run: () => { },
    };

    const second: CommandDefinition = {
      id: 'test.replace',
      group: 'Test',
      label: 'Second',
      run: () => { },
    };

    commandRegistry.register(first);
    commandRegistry.register(second);

    expect(commandRegistry.get()).toEqual([second]);
  });
});
