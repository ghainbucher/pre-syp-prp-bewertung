import { describe, expect, it } from 'vitest';

import { leererDatenbestand } from '../domain/defaults';
import {
  SICHERUNGSSTAND_SCHLUESSEL,
  aenderungVermerken,
  leererSicherungsstand,
  sicherungVermerken,
  sicherungsHinweis,
  standLesen,
  standLoeschen,
  standSchreiben,
  automatikText,
  standText,
  tageDazwischen,
  tagesschluessel,
  umfangText,
  umfangVon,
  type Sicherungsstand,
} from './sicherung';

/** Ein Zeitpunkt in Ortszeit – die Regel rechnet bewusst nicht in UTC. */
function am(jahr: number, monat: number, tag: number, stunde = 10): Date {
  return new Date(jahr, monat - 1, tag, stunde, 30);
}

function stand(teil: Partial<Sicherungsstand> = {}): Sicherungsstand {
  return { ...leererSicherungsstand(), ...teil };
}

function speicherAttrappe(): Storage {
  const inhalt = new Map<string, string>();
  return {
    get length() {
      return inhalt.size;
    },
    clear: () => inhalt.clear(),
    getItem: (schluessel: string) => inhalt.get(schluessel) ?? null,
    key: (index: number) => [...inhalt.keys()][index] ?? null,
    removeItem: (schluessel: string) => void inhalt.delete(schluessel),
    setItem: (schluessel: string, wert: string) => void inhalt.set(schluessel, wert),
  } as Storage;
}

describe('Erinnerung an die Sicherung (FA-46)', () => {
  it('erinnert nicht, solange am laufenden Tag nichts geändert wurde (AK-1)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      zuletztGeaendertAm: am(2026, 9, 8).toISOString(),
      zuletztAm: am(2026, 9, 8).toISOString(),
    });
    expect(sicherungsHinweis(s, heute)).toBeNull();
  });

  it('erinnert, wenn heute geändert und heute noch nicht gesichert wurde (AK-1)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 10).toISOString(),
      umfang: { klassen: 1, personen: 24, abschnitte: 3, bewertungen: 6 },
    });
    const hinweis = sicherungsHinweis(s, heute)!;
    expect(hinweis.stufe).toBe('hinweis');
    expect(hinweis.text).toContain('24 Personen');
  });

  it('erinnert nicht, wenn heute bereits gesichert wurde', () => {
    const heute = am(2026, 9, 11, 14);
    const s = stand({
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 11, 9).toISOString(),
    });
    expect(sicherungsHinweis(s, heute)).toBeNull();
  });

  it('nennt Zeitpunkt und Umfang der letzten Sicherung (AK-3)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 10, 16).toISOString(),
      umfang: { klassen: 1, personen: 24, abschnitte: 3, bewertungen: 6 },
    });
    expect(sicherungsHinweis(s, heute)!.text).toContain('10.09.2026, 16:30');
  });

  it('wird deutlicher, wenn die letzte Sicherung mehr als drei Tage zurückliegt (AK-5)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 7).toISOString(),
    });
    const hinweis = sicherungsHinweis(s, heute)!;
    expect(hinweis.stufe).toBe('dringend');
    expect(hinweis.text).toContain('4 Tage');
  });

  it('bleibt bei genau drei Tagen beim leiseren Hinweis (AK-5, Grenzfall)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 8).toISOString(),
    });
    expect(sicherungsHinweis(s, heute)!.stufe).toBe('hinweis');
  });

  it('ist deutlich, wenn es noch nie eine Sicherung gab', () => {
    const heute = am(2026, 9, 11);
    const s = stand({ zuletztGeaendertAm: heute.toISOString() });
    expect(sicherungsHinweis(s, heute)!.stufe).toBe('dringend');
  });

  it('entfällt, wenn die automatische Sicherung heute geschrieben hat (AK-6, FA-64)', () => {
    const heute = am(2026, 9, 11, 14);
    const s = stand({
      automatisch: 'ok',
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 11, 13).toISOString(),
    });
    expect(sicherungsHinweis(s, heute)).toBeNull();
  });

  it('ist verschärft, wenn die automatische Sicherung fehlgeschlagen ist (AK-6)', () => {
    const heute = am(2026, 9, 11);
    // Auch ohne Änderung am laufenden Tag – ein stilles Fehlschlagen ist unzulässig.
    const s = stand({ automatisch: 'fehler', zuletztAm: am(2026, 9, 10).toISOString() });
    const hinweis = sicherungsHinweis(s, heute)!;
    expect(hinweis.stufe).toBe('dringend');
    expect(hinweis.text).toContain('fehlgeschlagen');
  });
});

describe('Automatische Sicherung im Hinweis (FA-64)', () => {
  it('erinnert an die ausstehende Freigabe, sobald gearbeitet wurde (AK-6)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      automatisch: 'freigabe',
      ordnerName: 'Sicherungen',
      zuletztGeaendertAm: heute.toISOString(),
      zuletztAm: am(2026, 9, 10).toISOString(),
    });
    const hinweis = sicherungsHinweis(s, heute)!;
    expect(hinweis.stufe).toBe('hinweis');
    expect(hinweis.text).toContain('Sicherungen');
  });

  it('schweigt zur ausstehenden Freigabe, solange nichts geändert wurde', () => {
    const heute = am(2026, 9, 11);
    const s = stand({ automatisch: 'freigabe', ordnerName: 'Sicherungen' });
    expect(sicherungsHinweis(s, heute)).toBeNull();
  });

  it('nennt im Fehlerfall den Grund im Klartext (AK-5)', () => {
    const heute = am(2026, 9, 11);
    const s = stand({
      automatisch: 'fehler',
      fehlermeldung: '„Sicherungen“ ist nicht beschreibbar',
      zuletztAm: am(2026, 9, 10).toISOString(),
    });
    expect(sicherungsHinweis(s, heute)!.text).toContain('nicht beschreibbar');
  });

  it('beschreibt den Zustand der Automatik für die Fußzeile (AK-4)', () => {
    expect(automatikText(stand())).toContain('Keine automatische Sicherung');
    expect(automatikText(stand({ automatisch: 'ok', ordnerName: 'Sicherungen' }))).toContain('läuft');
    expect(automatikText(stand({ automatisch: 'freigabe', ordnerName: 'Sicherungen' }))).toContain(
      'Schreibberechtigung',
    );
    expect(
      automatikText(stand({ automatisch: 'fehler', fehlermeldung: 'Datenträger voll' })),
    ).toContain('Datenträger voll');
  });
});

describe('Stand fortschreiben', () => {
  it('hält Änderung und Sicherung getrennt fest', () => {
    const daten = leererDatenbestand();
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    const nachAenderung = aenderungVermerken(leererSicherungsstand(), am(2026, 9, 11, 9));
    expect(nachAenderung.zuletztAm).toBeNull();

    const nachSicherung = sicherungVermerken(nachAenderung, daten, am(2026, 9, 11, 10));
    expect(nachSicherung.zuletztGeaendertAm).toBe(am(2026, 9, 11, 9).toISOString());
    expect(nachSicherung.umfang).toEqual({ klassen: 1, personen: 0, abschnitte: 0, bewertungen: 0 });
  });

  it('zählt den Umfang aus dem Bestand', () => {
    const daten = leererDatenbestand();
    daten.personen.push({ id: 'p1', klasseId: 'k1', teamId: null, name: 'Berger Lena' });
    expect(umfangVon(daten).personen).toBe(1);
  });
});

describe('Texte', () => {
  it('setzt Ein- und Mehrzahl richtig', () => {
    expect(umfangText({ klassen: 1, personen: 24, abschnitte: 0, bewertungen: 0 })).toBe(
      '1 Klasse, 24 Personen',
    );
  });

  it('benennt einen leeren Bestand statt eine leere Zeile zu liefern', () => {
    expect(umfangText({ klassen: 0, personen: 0, abschnitte: 0, bewertungen: 0 })).toBe(
      'leerer Bestand',
    );
  });

  it('sagt deutlich, wenn noch nie gesichert wurde', () => {
    expect(standText(leererSicherungsstand())).toContain('noch keine Sicherung');
  });

  it('rechnet Tage in Ortszeit, nicht in UTC', () => {
    expect(tagesschluessel(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
    expect(tageDazwischen(am(2026, 9, 8, 23), am(2026, 9, 11, 1))).toBe(3);
  });
});

describe('Ablage', () => {
  it('schreibt und liest den Stand', () => {
    const speicher = speicherAttrappe();
    const s = stand({ zuletztAm: am(2026, 9, 11).toISOString(), automatisch: 'ok' });
    standSchreiben(s, speicher);
    expect(standLesen(speicher)).toEqual(s);
  });

  it('startet leer, wenn nichts oder Unlesbares gespeichert ist', () => {
    const speicher = speicherAttrappe();
    expect(standLesen(speicher)).toEqual(leererSicherungsstand());
    speicher.setItem(SICHERUNGSSTAND_SCHLUESSEL, '{kaputt');
    expect(standLesen(speicher)).toEqual(leererSicherungsstand());
  });

  it('entfernt den Stand vollständig (DS-03)', () => {
    const speicher = speicherAttrappe();
    standSchreiben(stand({ automatisch: 'ok' }), speicher);
    standLoeschen(speicher);
    expect(speicher.getItem(SICHERUNGSSTAND_SCHLUESSEL)).toBeNull();
  });

  it('arbeitet ohne Speicher weiter', () => {
    expect(standLesen(undefined)).toEqual(leererSicherungsstand());
    expect(() => standSchreiben(leererSicherungsstand(), undefined)).not.toThrow();
  });
});
