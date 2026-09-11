import type { Datenbestand } from '../domain/types';
import type { Aktion } from '../store/storeReducer';
import type { UiZustand } from '../ui/useUiZustand';

export interface AnsichtProps {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  ui: UiZustand;
  setUi: (aenderung: Partial<UiZustand>) => void;
}
