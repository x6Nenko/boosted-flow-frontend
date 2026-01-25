type Listener = () => void;

export type CommandDefinition = {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
};

let commands: CommandDefinition[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const commandRegistry = {
  get: () => commands,

  register: (command: CommandDefinition) => {
    commands = [...commands.filter((item) => item.id !== command.id), command];
    notify();
    return () => commandRegistry.unregister(command.id);
  },

  unregister: (id: string) => {
    const next = commands.filter((item) => item.id !== id);
    if (next.length === commands.length) return;
    commands = next;
    notify();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
