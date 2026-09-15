import { describe, expect, it } from 'vitest';

import {
  berechtigungPruefen,
  inOrdnerSchreiben,
  ordnerwahlMoeglich,
  type Berechtigung,
  type Zielordner,
} from './ordner';

/**
 * Ein Ordner-Doppelgänger. Ein echter Verzeichnis-Handle erfüllt dieselbe
 * Form; damit ist das Verhalten ohne Browser prüfbar.
 */
function ordnerAttrappe(
  optionen: {
    berechtigung?: Berechtigung;
    nachBitte?: Berechtigung;
    fehlerBeim?: 'oeffnen' | 'schreiben' | 'schliessen';
  } = {},
) {
  const geschrieben: Array<{ dateiname: string; inhalt: string }> = [];
  const gefragt: string[] = [];
  let berechtigung: Berechtigung = optionen.berechtigung ?? 'granted';

  const ordner: Zielordner = {
    name: 'Sicherungen',
    queryPermission: async () => berechtigung,
    requestPermission: async () => {
      gefragt.push('requestPermission');
      berechtigung = optionen.nachBitte ?? 'granted';
      return berechtigung;
    },
    getFileHandle: async (dateiname, wahl) => {
      gefragt.push(`getFileHandle:${dateiname}:${wahl?.create ? 'create' : 'nur-lesen'}`);
      if (optionen.fehlerBeim === 'oeffnen') throw new Error('Ordner nicht mehr erreichbar');
      return {
        createWritable: async () => ({
          write: async (inhalt: string) => {
            if (optionen.fehlerBeim === 'schreiben') throw new Error('Datenträger voll');
            geschrieben.push({ dateiname, inhalt });
          },
          close: async () => {
            if (optionen.fehlerBeim === 'schliessen') throw new Error('Abschluss gescheitert');
          },
        }),
      };
    },
  };

  return { ordner, geschrieben, gefragt };
}

/*
 * Vorher der Durchstich „bietet die automatische Sicherung nur an, wo der
 * Browser sie kann". Der musste zweigleisig laufen – je nachdem, ob der
 * Testbrowser die Schnittstelle kennt –, und prüfte in Wahrheit dieselbe eine
 * Entscheidung. Hier lassen sich beide Fälle nebeneinander stellen, und zwar
 * auch der, den kein installierter Browser mehr herstellt (Solution-Design 8.1).
 */
describe('Kennt der Browser die Ordnerwahl (FA-64 AK-7, NFA-05)', () => {
  /** Die Prüfung einmal in einer nachgestellten Umgebung laufen lassen. */
  function mitFenster(fenster: unknown, mitIndexedDb = true): boolean {
    const welt = globalThis as Record<string, unknown>;
    const vorherFenster = welt.window;
    const vorherDb = welt.indexedDB;
    if (fenster === undefined) delete welt.window;
    else welt.window = fenster;
    if (mitIndexedDb) welt.indexedDB = welt.indexedDB ?? {};
    else delete welt.indexedDB;
    try {
      return ordnerwahlMoeglich();
    } finally {
      if (vorherFenster === undefined) delete welt.window;
      else welt.window = vorherFenster;
      if (vorherDb === undefined) delete welt.indexedDB;
      else welt.indexedDB = vorherDb;
    }
  }

  it('sagt ja, wo es die Schnittstelle gibt', () => {
    expect(mitFenster({ showDirectoryPicker: () => undefined })).toBe(true);
  });

  it('sagt nein ohne die Schnittstelle', () => {
    // Firefox und Safari. Dort bleibt der Weg von Hand (FA-33) der einzige –
    // die Anwendung muss vollständig bedienbar bleiben (NFA-05).
    expect(mitFenster({})).toBe(false);
    expect(mitFenster({ showDirectoryPicker: 'ja' })).toBe(false);
  });

  it('sagt nein ohne IndexedDB', () => {
    // Ohne sie lässt sich der gewählte Ordner nicht merken. Einen Ordner bei
    // jedem Start neu zu wählen wäre keine automatische Sicherung.
    expect(mitFenster({ showDirectoryPicker: () => undefined }, false)).toBe(false);
  });

  it('sagt nein außerhalb eines Fensters', () => {
    expect(mitFenster(undefined)).toBe(false);
  });
});

describe('Berechtigung (FA-64 AK-6)', () => {
  it('meldet eine bestehende Berechtigung, ohne nachzufragen', async () => {
    const { ordner, gefragt } = ordnerAttrappe({ berechtigung: 'granted' });
    expect(await berechtigungPruefen(ordner, true)).toBe('granted');
    expect(gefragt).toEqual([]);
  });

  it('fragt nicht von sich aus nach, wenn die Berechtigung offen ist', async () => {
    const { ordner, gefragt } = ordnerAttrappe({ berechtigung: 'prompt' });
    expect(await berechtigungPruefen(ordner)).toBe('prompt');
    expect(gefragt).toEqual([]);
  });

  it('fragt nach, wenn es ausdrücklich verlangt wird', async () => {
    const { ordner, gefragt } = ordnerAttrappe({ berechtigung: 'prompt', nachBitte: 'granted' });
    expect(await berechtigungPruefen(ordner, true)).toBe('granted');
    expect(gefragt).toEqual(['requestPermission']);
  });

  it('nimmt eine Ablehnung als Ablehnung', async () => {
    const { ordner } = ordnerAttrappe({ berechtigung: 'prompt', nachBitte: 'denied' });
    expect(await berechtigungPruefen(ordner, true)).toBe('denied');
  });

  it('hält einen Handle ohne die Methoden für berechtigt', async () => {
    const ordner: Zielordner = {
      name: 'Alt',
      getFileHandle: async () => ({ createWritable: async () => ({ write: async () => {}, close: async () => {} }) }),
    };
    expect(await berechtigungPruefen(ordner, true)).toBe('granted');
  });
});

describe('Schreiben in den Ordner (FA-64 AK-2, AK-3, AK-5)', () => {
  it('schreibt die Tagesdatei und legt sie bei Bedarf an', async () => {
    const { ordner, geschrieben, gefragt } = ordnerAttrappe();
    const ergebnis = await inOrdnerSchreiben(ordner, 'pre-syp-prp-2026-09-11.json', '{"a":1}');
    expect(ergebnis).toEqual({ ok: true, dateiname: 'pre-syp-prp-2026-09-11.json' });
    expect(geschrieben).toEqual([{ dateiname: 'pre-syp-prp-2026-09-11.json', inhalt: '{"a":1}' }]);
    expect(gefragt).toContain('getFileHandle:pre-syp-prp-2026-09-11.json:create');
  });

  it('schreibt dieselbe Datei innerhalb eines Tages fort (AK-3)', async () => {
    const { ordner, geschrieben } = ordnerAttrappe();
    await inOrdnerSchreiben(ordner, 'pre-syp-prp-2026-09-11.json', 'erster Stand');
    await inOrdnerSchreiben(ordner, 'pre-syp-prp-2026-09-11.json', 'zweiter Stand');
    expect(geschrieben.map((e) => e.dateiname)).toEqual([
      'pre-syp-prp-2026-09-11.json',
      'pre-syp-prp-2026-09-11.json',
    ]);
  });

  it('schreibt ohne Berechtigung nicht und sagt warum (AK-5)', async () => {
    const { ordner, geschrieben } = ordnerAttrappe({ berechtigung: 'denied' });
    const ergebnis = await inOrdnerSchreiben(ordner, 'x.json', '{}');
    expect(ergebnis).toEqual({
      ok: false,
      grund: 'berechtigung',
      meldung: 'Für den Ordner „Sicherungen“ besteht keine Schreibberechtigung.',
    });
    expect(geschrieben).toEqual([]);
  });

  it('fragt beim Schreiben nicht von sich aus nach der Berechtigung (AK-6)', async () => {
    const { ordner, gefragt } = ordnerAttrappe({ berechtigung: 'prompt' });
    const ergebnis = await inOrdnerSchreiben(ordner, 'x.json', '{}');
    expect(ergebnis.ok).toBe(false);
    expect(gefragt).toEqual([]);
  });

  it('meldet einen nicht mehr erreichbaren Ordner, statt still zu scheitern (AK-5)', async () => {
    const { ordner } = ordnerAttrappe({ fehlerBeim: 'oeffnen' });
    const ergebnis = await inOrdnerSchreiben(ordner, 'x.json', '{}');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.grund).toBe('schreiben');
      expect(ergebnis.meldung).toContain('Ordner nicht mehr erreichbar');
    }
  });

  it('meldet einen Fehler beim Schreiben selbst', async () => {
    const { ordner } = ordnerAttrappe({ fehlerBeim: 'schreiben' });
    const ergebnis = await inOrdnerSchreiben(ordner, 'x.json', '{}');
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect(ergebnis.meldung).toContain('Datenträger voll');
  });

  it('schließt den Strom auch dann, wenn das Schreiben scheitert', async () => {
    let geschlossen = false;
    const ordner: Zielordner = {
      name: 'Sicherungen',
      queryPermission: async () => 'granted',
      getFileHandle: async () => ({
        createWritable: async () => ({
          write: async () => {
            throw new Error('Datenträger voll');
          },
          close: async () => {
            geschlossen = true;
          },
        }),
      }),
    };
    await inOrdnerSchreiben(ordner, 'x.json', '{}');
    expect(geschlossen).toBe(true);
  });
});
