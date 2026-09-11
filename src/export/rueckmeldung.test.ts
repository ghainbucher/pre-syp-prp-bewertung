import { describe, expect, it } from 'vitest';

import { einordnung, rueckmeldungDateiname, rueckmeldungHtml } from './rueckmeldung';

function blatt(teil: Partial<Parameters<typeof rueckmeldungHtml>[0]> = {}): string {
  return rueckmeldungHtml({
    personenname: 'Berger Lena',
    abschnittsname: 'Sprint 3',
    stand: 78.4,
    staerken: 'Schnittstelle sauber entworfen\nHat zweimal von sich aus Reviews übernommen',
    entwicklung: 'Tests erst am Schluss geschrieben',
    stand_datum: new Date(2026, 10, 14),
    ...teil,
  });
}

describe('rueckmeldungHtml (FA-42)', () => {
  it('beantwortet die drei Fragen (AK-1)', () => {
    const html = blatt();
    expect(html).toContain('Wo du stehst');
    expect(html).toContain('Das ist dir gelungen');
    expect(html).toContain('Daran arbeitest du im nächsten Abschnitt');
    expect(html).toContain('Schnittstelle sauber entworfen');
    expect(html).toContain('Tests erst am Schluss geschrieben');
  });

  it('macht aus jeder Zeile einen eigenen Punkt', () => {
    expect((blatt().match(/<li>/g) ?? []).length).toBe(3);
  });

  it('enthält keine Punktetabelle und keine Herleitung (AK-2, G10)', () => {
    const html = blatt();
    expect(html).not.toContain('<table');
    expect(html).not.toContain('Kriterium');
    expect(html).not.toContain('Gewicht');
    expect(html).not.toContain('Punkte');
  });

  it('enthält weder Note noch Notenvorschlag (AK-3)', () => {
    const html = blatt();
    expect(html).not.toContain('Notenvorschlag');
    expect(html).not.toContain('Notenstand');
    // „keine Note“ im Fußtext ist die einzige erlaubte Erwähnung.
    expect(html).toContain('ist keine Note');
  });

  it('gibt den Stand als grobe Einordnung, nicht als Nachkommastelle (AK-2)', () => {
    expect(blatt().toString()).toContain('rund 78 %');
    expect(einordnung(null)).toContain('noch keine Einordnung');
  });

  it('sagt es, wenn ein Feld noch leer ist', () => {
    expect(blatt({ entwicklung: '   ' })).toContain('noch nichts festgehalten');
  });

  it('kommt ohne Verweise nach außen und ohne Skript aus (NFA-03)', () => {
    const html = blatt();
    expect(html).not.toContain('<script');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
  });

  it('maskiert Sonderzeichen aus den Freitexten', () => {
    expect(blatt({ staerken: 'A & B <b>' })).toContain('A &amp; B &lt;b&gt;');
  });

  it('trägt Person und Abschnitt im Dateinamen', () => {
    expect(rueckmeldungDateiname('Berger Lena', 'Sprint 3', new Date('2026-11-14T08:00:00Z'))).toBe(
      'rueckmeldung-Berger_Lena-Sprint_3-2026-11-14.html',
    );
  });
});
