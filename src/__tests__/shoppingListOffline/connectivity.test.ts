import { isStateOnline } from '../../services/shoppingListOffline/connectivity';
import type { NetInfoState } from '@react-native-community/netinfo';

function state(partial: Partial<NetInfoState>): NetInfoState {
  return {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: null,
    ...partial,
  } as NetInfoState;
}

describe('isStateOnline', () => {
  it('is online when connected and reachable unknown', () => {
    expect(isStateOnline(state({ isInternetReachable: null }))).toBe(true);
  });

  it('is offline when not connected', () => {
    expect(isStateOnline(state({ isConnected: false }))).toBe(false);
  });

  it('is offline when reachable is false', () => {
    expect(isStateOnline(state({ isInternetReachable: false }))).toBe(false);
  });
});
