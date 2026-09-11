import { describe, expect, it } from 'vitest';

import {
  berechtigungPruefen,
  inOrdnerSchreiben,
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
