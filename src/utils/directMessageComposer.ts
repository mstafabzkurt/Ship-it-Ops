export type ComposerEnterAction = 'native' | 'send' | 'ignore';

export function getComposerEnterAction(input: {
  isWeb: boolean;
  key: string;
  shiftKey?: boolean;
  isComposing?: boolean;
  keyCode?: number;
  body: string;
  canSend: boolean;
  inFlight: boolean;
}): ComposerEnterAction {
  if (!input.isWeb || input.key !== 'Enter' || input.shiftKey
    || input.isComposing || input.keyCode === 229) return 'native';
  return input.canSend && !input.inFlight && input.body.trim() ? 'send' : 'ignore';
}

/** The ref changes synchronously, before React can commit pending UI state. */
export async function runDirectMessageSendOnce<T>(
  inFlightRef: { current: boolean },
  task: () => Promise<T>,
): Promise<T | undefined> {
  if (inFlightRef.current) return undefined;
  inFlightRef.current = true;
  try {
    return await task();
  } finally {
    inFlightRef.current = false;
  }
}
