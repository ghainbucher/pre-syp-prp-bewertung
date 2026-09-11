import { describe, expect, it } from 'vitest';

import {
  RUBRIK_SPRINT,
  STANDARD_NOTENSCHLUESSEL,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  strukturKopie,
  testRubrik,
} from '../domain/defaults';
import { rubrikVon } from '../domain/zuordnung';
import { storeReducer, type Aktion } from '../store/storeReducer';
import type { Abschnitt } from '../domain/types';
import { maskiert, rubrikblattDateiname, rubrikblattHtml } from './rubrikblatt';

function blatt(teil: Partial<Parameters<typeof rubrikblattHtml>[0]> = {}): string {
  return rubrikblattHtml({
    titel: 'Sprint 1',
    rubrik: strukturKopie(VORLAGE_RUBRIK_SPRINT),
    notenschluessel: strukturKopie(STANDARD_NOTENSCHLUESSEL),
    peerAktiv: false,
    stand: new Date('2026-09-11T08:00:00Z'),
    ...teil,
  });
}

describe('rubrikblattHtml (FA-39)', () => {
  it('nennt alle Kriterien mit Beschreibung und Punktemaximum (AK-1)', () => {
    const html = blatt();
    for (const kriterium of VORLAGE_RUBRIK_SPRINT.team) {
      expect(html).toContain(maskiert(kriterium.name));
      expect(html).toContain(maskiert(kriterium.beschreibung));
    }
    // „Funktionalität“ ist mit 10 Punkten hinterlegt.
    expect(html).toContain('>10</td>');
  });

  it('nennt die Kategoriegewichte und den Notenschlüssel (AK-1)', () => {
    const html = blatt();
    expect(html).toContain('zählt 45 %');
    expect(html).toContain('zählt 20 %');
    expect(html).toContain('zählt 35 %');
    expect(html).toContain('ab 90 %');
    expect(html).toContain('Nicht genügend');
  });

  it('enthält weder Namen noch erfasste Punkte (AK-2)', () => {
    const aktionen: Aktion[] = [
      { art: 'klasse/anlegen', id: 'k1', name: '4AHIF' },
      { art: 'team/anlegen', id: 'team1', klasseId: 'k1', name: 'Team Kepler' },
      {
        art: 'person/anlegen',
        klasseId: 'k1',
        teamId: 'team1',
        namen: [{ id: 'p1', name: 'Berger Lena' }],
      },
      {
        art: 'abschnitt/anlegen',
        abschnitt: {
          id: 's1',
          klasseId: 'k1',
          nummer: 1,
          name: 'Sprint 1',
          art: 'sprint',
          strang: 'praxis',
          rubrikId: RUBRIK_SPRINT,
          von: '',
          bis: '',
          faktor: 1,
          peerAktiv: false,
        },
      },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 7 },
      {
        art: 'bewertung/individuellNotiz',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        notiz: 'Interne Beobachtung',
      },
    ];
    const daten = aktionen.reduce(storeReducer, leererDatenbestand());
    const abschnitt = daten.abschnitte[0];
    const html = rubrikblattHtml({
      titel: abschnitt.name,
      rubrik: rubrikVon(daten, abschnitt),
      notenschluessel: daten.notenschluessel,
      peerAktiv: abschnitt.peerAktiv,
    });

    expect(html).not.toContain('Berger Lena');
    expect(html).not.toContain('Team Kepler');
    expect(html).not.toContain('Interne Beobachtung');
  });

  it('kommt ohne Verweise nach außen und ohne Skript aus (NFA-03, AK-3)', () => {
    const html = blatt();
    expect(html).not.toContain('<script');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
  });

  it('zeigt die eingefrorene Rubrik, nicht die inzwischen geänderte (AK-4, FA-65)', () => {
    const eingefroren = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    eingefroren.team[0] = { ...eingefroren.team[0], name: 'Funktionsumfang' };
    const abschnitt: Abschnitt = {
      id: 's1',
      klasseId: 'k1',
      nummer: 1,
      name: 'Sprint 1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK_SPRINT,
      rubrikKopie: eingefroren,
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    };
    const daten = leererDatenbestand();
    daten.abschnitte.push(abschnitt);

    const html = blatt({ rubrik: rubrikVon(daten, abschnitt) });
    expect(html).toContain('Funktionsumfang');
    expect(html).not.toContain('>Funktionalität<');
  });

  it('lässt die Peer-Kategorie weg, solange sie nicht eingeschaltet ist (AK-5)', () => {
    expect(blatt({ peerAktiv: false })).not.toContain('Peer- und Selbsteinschätzung');
    expect(blatt({ peerAktiv: true })).toContain('Peer- und Selbsteinschätzung');
  });

  it('weist eine Kategorie ohne Gewicht als nicht zählend aus (AK-7)', () => {
    const rubrik = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    rubrik.gewichte.prozess = 0;
    expect(blatt({ rubrik })).toContain('zählt in diesem Abschnitt nicht');
  });

  it('lässt Kategorien ohne Kriterien weg (AK-7)', () => {
    // Die Testrubrik führt nur Fragen im individuellen Teil.
    const html = blatt({ rubrik: testRubrik('r1', 'Test 1') });
    expect(html).not.toContain('Team-Ergebnis');
    expect(html).not.toContain('Scrum-Prozess');
    expect(html).toContain('Individueller Beitrag');
  });

  it('maskiert Zeichen, die das Blatt zerschießen würden', () => {
    const rubrik = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    rubrik.team[0] = { ...rubrik.team[0], name: 'A & B <script>' };
    const html = blatt({ rubrik });
    expect(html).toContain('A &amp; B &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});

describe('rubrikblattDateiname', () => {
  it('baut einen dateisystemtauglichen Namen mit Datum', () => {
    expect(rubrikblattDateiname('Sprint 1', new Date('2026-09-11T08:00:00Z'))).toBe(
      'pre-syp-prp-kriterien-Sprint_1-2026-09-11.html',
    );
  });

  it('fängt einen leeren Titel ab', () => {
    expect(rubrikblattDateiname('  ', new Date('2026-09-11T08:00:00Z'))).toBe(
      'pre-syp-prp-kriterien-Abschnitt-2026-09-11.html',
    );
  });
});
