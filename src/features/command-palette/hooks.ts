import { useEffect, useSyncExternalStore } from 'react';
import { commandPaletteStore } from './command-palette-store';
import { commandRegistry, type CommandDefinition } from './command-registry';

export function useCommandPaletteOpen() {
  return useSyncExternalStore(commandPaletteStore.subscribe, commandPaletteStore.isOpen);
}

export function useCommandRegistry() {
  return useSyncExternalStore(commandRegistry.subscribe, commandRegistry.get);
}

export function useRegisterCommand(command: CommandDefinition | null) {
  useEffect(() => {
    if (!command) return;
    return commandRegistry.register(command);
  }, [command]);
}
