/**
 * Automatische Sicherung in einen gewählten Ordner (FA-64, ADR-011).
 *
 * Grundlage ist die File System Access API: Ein einmal gewählter
 * Verzeichnis-Handle bleibt in IndexedDB liegen, danach schreibt die Anwendung
 * ohne Dialog in diesen Ordner. Es entsteht **kein Netzwerkaufruf** (NFA-03) –
 * geschrieben wird eine lokale Datei. Dass ein Sync-Client den Ordner spiegelt,
 * geschieht außerhalb dieser Anwendung.
 *
 * Die Schnittstelle gibt es nur in Chromium-Browsern. Fehlt sie, bleibt es beim
 * manuellen Export (FA-33) – die Anwendung sagt das, statt die Funktion
 * anzubieten und scheitern zu lassen (FA-64 AK-7).
 *
 * Die Typen unten sind bewusst **eigene, schmale Beschreibungen** statt der
 * DOM-Typen: `queryPermission` und `requestPermission` stehen in keiner
 * `lib.dom`, und nur so lässt sich das Verhalten ohne Browser prüfen. Ein
 * echter Handle erfüllt sie strukturell.
 */

/** Was zum Schreiben einer Datei gebraucht wird. */
export interface Schreibstrom {
  write(inhalt: string): Promise<void>;
  close(): Promise<void>;
}

export interface Zieldatei {
  createWritable(): Promise<Schreibstrom>;
}

export type Berechtigung = 'granted' | 'denied' | 'prompt';

export interface Zielordner {
  readonly name: string;
  getFileHandle(name: string, optionen?: { create?: boolean }): Promise<Zieldatei>;
  queryPermission?(optionen: { mode: 'readwrite' }): Promise<Berechtigung>;
  requestPermission?(optionen: { mode: 'readwrite' }): Promise<Berechtigung>;
}

export type Fehlergrund = 'berechtigung' | 'schreiben';

export type Schreibergebnis =
  | { ok: true; dateiname: string }
  | { ok: false; grund: Fehlergrund; meldung: string };

/**
 * Steht die Schreibberechtigung für diesen Ordner?
 *
 * `nachfragen` nur mit einer Nutzerhandlung aufrufen – der Browser lehnt eine
 * Nachfrage ohne Klick ab. Fehlen die Methoden ganz, gilt der Handle als
 * berechtigt; ältere Umsetzungen kennen sie nicht.
 */
export async function berechtigungPruefen(
  ordner: Zielordner,
  nachfragen = false,
): Promise<Berechtigung> {
  try {
    const vorhanden = (await ordner.queryPermission?.({ mode: 'readwrite' })) ?? 'granted';
    if (vorhanden === 'granted' || !nachfragen) return vorhanden;
    return (await ordner.requestPermission?.({ mode: 'readwrite' })) ?? 'granted';
  } catch {
    return 'denied';
  }
}

/**
 * Schreibt den Inhalt in die Datei dieses Namens (FA-64 AK-2, AK-3).
 *
 * `createWritable` setzt die Datei zurück: Die Tagesdatei wird damit
 * fortgeschrieben, Dateien früherer Tage bleiben unberührt, weil ihr Name das
 * Datum trägt.
 *
 * Ein Fehlschlag wird **zurückgegeben, nicht geschluckt** – eine automatische
 * Sicherung, die still fehlschlägt, ist schlechter als gar keine (ADR-011).
 */
export async function inOrdnerSchreiben(
  ordner: Zielordner,
  dateiname: string,
  inhalt: string,
): Promise<Schreibergebnis> {
  const berechtigung = await berechtigungPruefen(ordner);
  if (berechtigung !== 'granted') {
    return {
      ok: false,
      grund: 'berechtigung',
      meldung: `Für den Ordner „${ordner.name}“ besteht keine Schreibberechtigung.`,
    };
  }

  try {
    const datei = await ordner.getFileHandle(dateiname, { create: true });
    const strom = await datei.createWritable();
    try {
      await strom.write(inhalt);
    } finally {
      await strom.close();
    }
    return { ok: true, dateiname };
  } catch (fehler) {
    return {
      ok: false,
      grund: 'schreiben',
      meldung:
        fehler instanceof Error && fehler.message
          ? `„${ordner.name}“ ist nicht beschreibbar: ${fehler.message}`
          : `„${ordner.name}“ ist nicht beschreibbar.`,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Browserschnittstelle – bewusst dünn, damit sie nichts entscheidet           */
/* -------------------------------------------------------------------------- */

interface FensterMitOrdnerwahl {
  showDirectoryPicker?: (optionen?: { mode?: 'readwrite'; id?: string }) => Promise<Zielordner>;
}

/** Kennt dieser Browser die File System Access API (FA-64 AK-7)? */
export function ordnerwahlMoeglich(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as FensterMitOrdnerwahl).showDirectoryPicker === 'function' &&
    typeof indexedDB !== 'undefined'
  );
}

/** Öffnet die Ordnerwahl. `null`, wenn abgebrochen oder nicht unterstützt. */
export async function ordnerWaehlen(): Promise<Zielordner | null> {
  const fenster = window as unknown as FensterMitOrdnerwahl;
  if (!fenster.showDirectoryPicker) return null;
  try {
    // `id` sorgt dafür, dass der Dialog beim nächsten Mal dort öffnet.
    return await fenster.showDirectoryPicker({ mode: 'readwrite', id: 'pre-syp-prp-sicherung' });
  } catch {
    // Abbruch durch die Lehrkraft ist kein Fehlerfall.
    return null;
  }
}

const DB_NAME = 'pre-syp-prp';
const LADEN = 'ordner';
const HANDLE_SCHLUESSEL = 'sicherungsordner';

/**
 * IndexedDB, weil ein Verzeichnis-Handle sich nicht in Text verwandeln lässt
 * und damit nicht in den localStorage passt.
 */
function datenbank(): Promise<IDBDatabase> {
  return new Promise((erfuellen, ablehnen) => {
    const anfrage = indexedDB.open(DB_NAME, 1);
    anfrage.onupgradeneeded = () => {
      if (!anfrage.result.objectStoreNames.contains(LADEN)) {
        anfrage.result.createObjectStore(LADEN);
      }
    };
    anfrage.onsuccess = () => erfuellen(anfrage.result);
    anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}

function inLaden<T>(modus: IDBTransactionMode, arbeit: (laden: IDBObjectStore) => IDBRequest): Promise<T> {
  return datenbank().then(
    (db) =>
      new Promise<T>((erfuellen, ablehnen) => {
        const anfrage = arbeit(db.transaction(LADEN, modus).objectStore(LADEN));
        anfrage.onsuccess = () => erfuellen(anfrage.result as T);
        anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB-Zugriff gescheitert'));
      }),
  );
}

export async function ordnerMerken(ordner: Zielordner): Promise<void> {
  try {
    await inLaden<void>('readwrite', (laden) => laden.put(ordner, HANDLE_SCHLUESSEL));
  } catch {
    /* Ohne Ablage muss der Ordner nach dem Neuladen erneut gewählt werden. */
  }
}

export async function ordnerHolen(): Promise<Zielordner | null> {
  if (!ordnerwahlMoeglich()) return null;
  try {
    return (await inLaden<Zielordner | undefined>('readonly', (laden) => laden.get(HANDLE_SCHLUESSEL))) ?? null;
  } catch {
    return null;
  }
}

export async function ordnerVergessen(): Promise<void> {
  try {
    await inLaden<void>('readwrite', (laden) => laden.delete(HANDLE_SCHLUESSEL));
  } catch {
    /* nichts zu tun */
  }
}
