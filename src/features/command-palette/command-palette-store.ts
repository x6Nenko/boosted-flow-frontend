type Listener = () => void;

let isOpen = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const commandPaletteStore = {
  isOpen: () => isOpen,

  open: () => {
    isOpen = true;
    notify();
  },

  close: () => {
    isOpen = false;
    notify();
  },

  toggle: () => {
    isOpen = !isOpen;
    notify();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
