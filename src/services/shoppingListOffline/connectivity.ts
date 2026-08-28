import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export function isStateOnline(state: NetInfoState): boolean {
  if (state.isConnected !== true) {
    return false;
  }
  // null reachable = unknown; treat as online when connected
  if (state.isInternetReachable === false) {
    return false;
  }
  return true;
}

export async function getIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isStateOnline(state);
}

/**
 * Subscribe to connectivity. Online transitions are debounced.
 */
export function subscribeConnectivity(
  onChange: (online: boolean) => void,
  debounceMs = 500,
): () => void {
  let lastOnline: boolean | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = isStateOnline(state);
    if (online === lastOnline) {
      return;
    }

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (online) {
      timer = setTimeout(() => {
        lastOnline = true;
        onChange(true);
      }, debounceMs);
    } else {
      lastOnline = false;
      onChange(false);
    }
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
