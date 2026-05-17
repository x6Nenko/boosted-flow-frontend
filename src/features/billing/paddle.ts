import { initializePaddle } from '@paddle/paddle-js';
import type { Environments, Paddle, PaddleEventData } from '@paddle/paddle-js';

type PaddleEventHandler = (event: PaddleEventData) => void;

const paddleEventHandlers = new Set<PaddleEventHandler>();
let paddlePromise: Promise<Paddle> | null = null;

function getPaddleEnvironment(): Environments {
  const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT;
  return environment === 'production' ? 'production' : 'sandbox';
}

async function getPaddle(): Promise<Paddle> {
  if (!paddlePromise) {
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

    if (!token) {
      throw new Error('Paddle client token is not configured');
    }

    paddlePromise = initializePaddle({
      token,
      environment: getPaddleEnvironment(),
      eventCallback: (event) => {
        paddleEventHandlers.forEach((handler) => handler(event));
      },
    }).then((paddle) => {
      if (!paddle) {
        throw new Error('Paddle failed to initialize');
      }

      return paddle;
    });
  }

  return paddlePromise;
}

export async function openPaddleCheckout(transactionId: string, onEvent: PaddleEventHandler) {
  paddleEventHandlers.add(onEvent);

  try {
    const paddle = await getPaddle();
    paddle.Checkout.open({
      transactionId,
      settings: {
        theme: 'dark',
      },
    });
  } catch (error) {
    paddleEventHandlers.delete(onEvent);
    throw error;
  }

  return () => {
    paddleEventHandlers.delete(onEvent);
  };
}
