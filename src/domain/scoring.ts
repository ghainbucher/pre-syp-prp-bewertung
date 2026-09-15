/**
 * Berechnung von Prozentwerten und Noten.
 *
 * Reine Funktionen ohne Zustand und ohne Seiteneffekte – siehe
 * docs/solution-design.md, Abschnitt 6. Umsetzung von FA-21 bis FA-25 und
 * FA-59 (zwei Stränge).
 */

import type {
  Abschnitt,
  AbschnittMitErgebnis,
  Abschnittsergebnis,
  Bewertung,
  Datenbestand,
  Gesamtergebnis,
  GesetzterWert,
  Id,
  Kategorieergebnis,
  Kriterium,
  Notenstand,
  Notenstufe,
  Notenvorschlag,
  Peerergebnis,
  Person,
  Punkte,
  Rubrik,
  Strang,
  Strangergebnis,
  GithubAuswertung,
  Verstehensnachweis,
  Zeitraum,
} from './types';
import {
  BEFUND_SCHWELLE,
  OHNE_STICHTAG,
  PEER_DECKELUNG,
  VERSTEHENS_ANTEIL,
  VERSTEHENS_PROZENT,
  ZEITFAKTOR_ZWEITE_HAELFTE,
} from './defaults';
import {
  abschnitteOhneSpur,
  abschnitteVon,
  auslassungen,
  gehoertZu,
  imZeitraumFuer,
  mitgliederIn,
  planungVon,
  rubrikFuer,
  teamIn,
  teamsIn,
  zeitraumVon,
} from './zuordnung';

export const PEER_MIN = 1;
export const PEER_MAX = 5;

/** Ab dieser Abweichung in Prozentpunkten gilt ein Selbstbild als auffällig (FA-27). */
export const ABWEICHUNG_SCHWELLE = 20;

export const KATEGORIE_BEZEICHNUNG = {
  team: 'Team-Ergebnis',
  prozess: 'Scrum-Prozess',
  individuell: 'Individueller Beitrag',
  peer: 'Peer-Bewertung',
} as const;

/** Begrenzt einen Wert auf das Intervall [min, max]. */
function klemme(wert: number, min: number, max: number): number {
  return Math.min(Math.max(wert, min), max);
}

function istZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert);
}

/**
 * Ergebnis einer punktebasierten Kategorie (FA-21).
 *
 * Nur ausgefüllte Kriterien gehen in Zähler **und** Nenner ein: ein noch nicht
 * bewertetes Kriterium senkt das Ergebnis nicht. Punkte werden auf [0, max]
 * begrenzt. `null`, wenn kein Kriterium ausgefüllt ist.
 */
export function kategorieErgebnis(
  punkte: Punkte | undefined,
  kriterien: Kriterium[],
): Kategorieergebnis | null {
  if (!punkte) return null;
  let erreicht = 0;
  let moeglich = 0;
  let ausgefuellt = 0;

  for (const kriterium of kriterien) {
    const wert = punkte[kriterium.id];
    if (!istZahl(wert)) continue;
    const max = Math.max(0, kriterium.max);
    erreicht += klemme(wert, 0, max);
    moeglich += max;
    ausgefuellt += 1;
  }

  if (ausgefuellt === 0 || moeglich === 0) return null;
  const prozent = (erreicht / moeglich) * 100;
  return {
    prozent,
    prozentBerechnet: prozent,
    gesetzt: null,
    erreicht,
    moeglich,
    ausgefuellt,
    gesamt: kriterien.length,
  };
}

/** Bildet einen Peer-Wert der Skala 1–5 linear auf 0–100 % ab (FA-22). */
export function peerWertInProzent(wert: number): number {
  return ((klemme(wert, PEER_MIN, PEER_MAX) - PEER_MIN) / (PEER_MAX - PEER_MIN)) * 100;
}

/**
 * Peer-Ergebnis einer Person (FA-22).
 *
 * Gemittelt wird über alle vorliegenden Einzelurteile der Teammitglieder.
 * Fehlende Urteile verringern nur den Nenner. Ob die Selbsteinschätzung zählt,
 * steuert `rubrik.selbstZaehlt` (FA-15).
 */
export function peerErgebnis(
  bewertung: Bewertung | undefined,
  personId: Id,
  teammitglieder: Person[],
  rubrik: Rubrik,
): Peerergebnis | null {
  if (!bewertung || rubrik.peer.length === 0) return null;

  let summe = 0;
  let anzahlUrteile = 0;
  const bewertende = new Set<Id>();

  for (const mitglied of teammitglieder) {
    if (!rubrik.selbstZaehlt && mitglied.id === personId) continue;
    const urteil = bewertung.peer?.[mitglied.id]?.[personId];
    if (!urteil) continue;
    for (const kriterium of rubrik.peer) {
      const wert = urteil[kriterium.id];
      if (!istZahl(wert)) continue;
      summe += peerWertInProzent(wert);
      anzahlUrteile += 1;
      bewertende.add(mitglied.id);
    }
  }

  if (anzahlUrteile === 0) return null;
  return { prozent: summe / anzahlUrteile, bewertende: bewertende.size };
}

/** Selbsteinschätzung einer Person in Prozent, unabhängig von `selbstZaehlt`. */
export function selbstEinschaetzung(
  bewertung: Bewertung | undefined,
  personId: Id,
  rubrik: Rubrik,
): number | null {
  const urteil = bewertung?.peer?.[personId]?.[personId];
  if (!urteil) return null;
  let summe = 0;
  let anzahl = 0;
  for (const kriterium of rubrik.peer) {
    const wert = urteil[kriterium.id];
    if (!istZahl(wert)) continue;
    summe += peerWertInProzent(wert);
    anzahl += 1;
  }
  return anzahl === 0 ? null : summe / anzahl;
}

/**
 * Verrechnet den Verstehensnachweis in den individuellen Beitrag (FA-40 AK-2).
 *
 * Die Kriterien der Kategorie tragen `100 − anteil` Prozent, der Nachweis
 * `anteil`. Liegt **kein** Nachweis vor, bleibt die Kategorie unverändert
 * (AK-3) – ein fehlender Nachweis ist kein misslungener, das ist dieselbe
 * Regel wie bei den Kategorien (ADR-004). Liegt umgekehrt nur der Nachweis
 * vor, trägt er die Kategorie allein: Auch er ist eine erhobene Leistung.
 */
export function mitVerstehensnachweis(
  kategorie: Kategorieergebnis | null,
  nachweis: Verstehensnachweis | undefined,
  anteil = VERSTEHENS_ANTEIL,
): Kategorieergebnis | null {
  if (!nachweis) return kategorie;
  const teil = klemme(istZahl(anteil) ? anteil : 0, 0, 100);
  if (teil === 0) return kategorie;

  const nachweisProzent = VERSTEHENS_PROZENT[nachweis.stufe];
  if (!kategorie) {
    return {
      prozent: nachweisProzent,
      prozentBerechnet: nachweisProzent,
      gesetzt: null,
      erreicht: 0,
      moeglich: 0,
      ausgefuellt: 0,
      gesamt: 0,
    };
  }

  const gemischt = ((100 - teil) * kategorie.prozent + teil * nachweisProzent) / 100;
  return { ...kategorie, prozent: gemischt, prozentBerechnet: gemischt };
}

/**
 * Legt einen gesetzten Wert über ein Kategorieergebnis (FA-50 AK-1, AK-3).
 *
 * Der berechnete Wert bleibt daneben stehen – auch dann, wenn gar keiner
 * vorliegt, weil die Ebene darunter leer ist. Genau das ist der Fall, für den
 * FA-50 da ist: setzen, ohne den Umweg über Einzelpunkte zu gehen.
 */
function kategorieMitGesetzt(
  berechnet: Kategorieergebnis | null,
  gesetzt: GesetzterWert | undefined,
): Kategorieergebnis | null {
  if (!gesetzt) return berechnet;
  return {
    prozent: klemme(gesetzt.prozent, 0, 100),
    prozentBerechnet: berechnet?.prozent ?? null,
    gesetzt,
    erreicht: berechnet?.erreicht ?? 0,
    moeglich: berechnet?.moeglich ?? 0,
    ausgefuellt: berechnet?.ausgefuellt ?? 0,
    gesamt: berechnet?.gesamt ?? 0,
  };
}

/**
 * Verschiebung des Abschnittsergebnisses durch die Peer-Werte (FA-45).
 *
 * Neutraler Punkt ist 50 %: Wer dort liegt, wird nicht verschoben (AK-2).
 * Ohne Peer-Ergebnis ist die Korrektur 0 (AK-3). Die Klemmung ist rechnerisch
 * nicht nötig, weil ein Peer-Ergebnis ohnehin in [0, 100] liegt – sie steht
 * hier, damit eine spätere Skalenänderung die Deckelung nicht aushebelt.
 */
export function peerKorrektur(peerProzent: number | null, deckelung: number): number {
  if (peerProzent === null || !istZahl(peerProzent)) return 0;
  const grenze = Math.max(0, istZahl(deckelung) ? deckelung : 0);
  return klemme(((peerProzent - 50) / 50) * grenze, -grenze, grenze);
}

/**
 * Ergebnis einer Person in einem Abschnitt aus schon aufgelösten Bausteinen.
 *
 * Gewichtetes Mittel der vorhandenen Kategorieergebnisse. Kategorien ohne
 * Daten und Kategorien mit Gewicht 0 werden aus der Gewichtung
 * herausgerechnet – sie gelten nicht als 0 Prozent (ADR-004).
 */
export function ergebnisAusRubrik(
  bewertung: Bewertung | undefined,
  person: Person,
  teammitglieder: Person[],
  rubrik: Rubrik,
  peerAktiv: boolean,
  deckelung = PEER_DECKELUNG,
  verstehensAnteil = VERSTEHENS_ANTEIL,
): Abschnittsergebnis {
  const gesetzteKategorien = bewertung?.gesetzt?.kategorie;
  const team = kategorieMitGesetzt(
    kategorieErgebnis(bewertung?.team, rubrik.team),
    gesetzteKategorien?.team,
  );
  const prozess = kategorieMitGesetzt(
    kategorieErgebnis(bewertung?.prozess, rubrik.prozess),
    gesetzteKategorien?.prozess,
  );
  // Reihenfolge: erst den Verstehensnachweis einrechnen (FA-40), dann einen
  // gesetzten Wert darüberlegen (FA-50) – ein gesetzter Wert ist die
  // Entscheidung der Lehrkraft und steht über jeder Rechnung.
  const individuell = kategorieMitGesetzt(
    mitVerstehensnachweis(
      kategorieErgebnis(bewertung?.individuell?.[person.id]?.punkte, rubrik.individuell),
      bewertung?.individuell?.[person.id]?.verstehen,
      verstehensAnteil,
    ),
    gesetzteKategorien?.individuell,
  );
  const peer = peerAktiv ? peerErgebnis(bewertung, person.id, teammitglieder, rubrik) : null;

  // Peer steht bewusst **nicht** in dieser Liste: Seit FA-45 geht der
  // Peer-Anteil nicht als gewichtete Kategorie ein, sondern als gedeckelter
  // Korrekturfaktor weiter unten. `rubrik.gewichte.peer` bleibt wirkungslos –
  // sonst zählte dieselbe Einschätzung zweimal.
  const anteile: Array<{ schluessel: keyof typeof KATEGORIE_BEZEICHNUNG; prozent: number | null }> = [
    { schluessel: 'team', prozent: team?.prozent ?? null },
    { schluessel: 'prozess', prozent: prozess?.prozent ?? null },
    { schluessel: 'individuell', prozent: individuell?.prozent ?? null },
  ];

  let gewichtssumme = 0;
  let summe = 0;
  const fehlend: string[] = [];

  for (const anteil of anteile) {
    const gewicht = rubrik.gewichte[anteil.schluessel] ?? 0;
    if (gewicht <= 0) continue;
    if (anteil.prozent === null) {
      fehlend.push(KATEGORIE_BEZEICHNUNG[anteil.schluessel]);
      continue;
    }
    gewichtssumme += gewicht;
    summe += gewicht * anteil.prozent;
  }

  const vorKorrektur = gewichtssumme > 0 ? summe / gewichtssumme : null;
  // Ohne Grundlage gibt es nichts zu korrigieren: Eine Person ohne jedes
  // Ergebnis bekommt nicht plötzlich 5 % aus Peer-Werten.
  const korrektur = vorKorrektur === null ? 0 : peerKorrektur(peer?.prozent ?? null, deckelung);
  const berechnet = vorKorrektur === null ? null : klemme(vorKorrektur + korrektur, 0, 100);

  // FA-50 AK-3: Ein gesetztes Abschnittsergebnis gilt für alles darüber. Die
  // Rechnung darunter läuft weiter – ihr Ergebnis wird nur nicht weitergereicht.
  const gesetzt = bewertung?.gesetzt?.abschnittsergebnis?.[person.id] ?? null;

  return {
    prozent: gesetzt ? klemme(gesetzt.prozent, 0, 100) : berechnet,
    prozentBerechnet: berechnet,
    gesetzt,
    prozentVorKorrektur: vorKorrektur,
    korrektur,
    team,
    prozess,
    individuell,
    peer,
    selbst: peerAktiv ? selbstEinschaetzung(bewertung, person.id, rubrik) : null,
    fehlend,
  };
}

/**
 * Ergebnis einer Person in einem Abschnitt (FA-23).
 *
 * Löst Rubrik, Team und Teammitglieder aus dem Bestand auf – für einen Test
 * ohne Team greift dabei der Schlüssel mit `null`.
 */
export function abschnittsErgebnis(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  person: Person,
  bewertungen: Map<string, Bewertung>,
): Abschnittsergebnis {
  const teamId = abschnitt.art === 'test' ? null : teamIn(daten, abschnitt.id, person.id);
  // Ab Schemastand 3 hängen die geltenden Kriterien am Team, nicht am
  // Abschnitt (FA-67): Zwei Teams desselben Sprints können verschiedene haben.
  const rubrik = rubrikFuer(daten, abschnitt, teamId);
  const bewertung = bewertungen.get(bewertungsSchluessel(abschnitt.id, teamId));
  const mitglieder = mitgliederIn(daten, abschnitt.id, teamId);
  return ergebnisAusRubrik(
    bewertung,
    person,
    mitglieder,
    rubrik,
    abschnitt.peerAktiv,
    daten.peerDeckelung,
    daten.verstehensAnteil,
  );
}

/**
 * Vorschlag für den Sprintwert eines Teams (FA-82 AK-2).
 *
 * Der **Team-Anteil**: Team-Ergebnis und Scrum-Prozess zusammen, auf 100 %
 * umgerechnet. Das sind die beiden Kategorien, die ein Team gemeinsam
 * verantwortet. Individueller Beitrag und Peer-Korrektur bleiben draußen –
 * sie betreffen Personen, und ein Mittel daraus wäre in einem Dreierteam auf
 * die Werte der übrigen zurückrechenbar.
 *
 * Eine fehlende Kategorie fällt aus der Gewichtung (ADR-004), sie zählt nicht
 * als 0. Fehlen beide, gibt es keinen Vorschlag.
 */
export function sprintwertVorschlag(
  bewertung: Bewertung | undefined,
  rubrik: Rubrik,
): number | null {
  const teile: Array<{ prozent: number; gewicht: number }> = [];
  const team = kategorieErgebnis(bewertung?.team, rubrik.team);
  const prozess = kategorieErgebnis(bewertung?.prozess, rubrik.prozess);
  if (team?.prozent !== null && team?.prozent !== undefined) {
    teile.push({ prozent: team.prozent, gewicht: rubrik.gewichte.team });
  }
  if (prozess?.prozent !== null && prozess?.prozent !== undefined) {
    teile.push({ prozent: prozess.prozent, gewicht: rubrik.gewichte.prozess });
  }
  const summe = teile.reduce((s, t) => s + t.gewicht, 0);
  if (teile.length === 0 || summe <= 0) return null;
  return teile.reduce((s, t) => s + t.prozent * t.gewicht, 0) / summe;
}

/* -------------------------------------------------------------------------- */
/* Befund: agiert das Team als Team? (FA-79)                                  */
/* -------------------------------------------------------------------------- */

/** Die drei Muster aus Fachkonzept 8.2a (FA-79 AK-2). */
export type Muster = 'zusammen' | 'zusammen-schwach' | 'ungleich' | 'unklar';

/** Die drei Signale zu einer Person (FA-79 AK-4). */
export interface Personensignal {
  person: Person;
  /** Individueller Beitrag in Prozent, `null` wenn nichts erfasst ist. */
  individuell: number | null;
  /** Abstand zum Median der Mitglieder in Prozentpunkten (AK-4). */
  abstand: number | null;
  /** Abstand zum Team-Ergebnis – nur zur Anzeige, nicht Signalgröße. */
  abstandTeam: number | null;
  /** Abstand des Peer-Werts zum Mittel des Teams in Prozentpunkten. */
  peerAbstand: number | null;
  /** Abgeschlossene Sprints dieses Teams ohne Spur dieser Person (FA-78). */
  ohneSpur: number;
  /** Wie viele der drei Signale in dieselbe Richtung zeigen. */
  signale: number;
  richtung: 'unter' | 'ueber' | null;
  /** Mindestens zwei Signale in derselben Richtung (AK-4). */
  auffaellig: boolean;
}

export interface Befund {
  muster: Muster;
  /** Die geltende Schwelle – wird mit dem Befund genannt (AK-4b). */
  schwelle: number;
  /** Team-Ergebnis des Abschnitts, für alle Mitglieder gleich. */
  teamProzent: number | null;
  /**
   * Median der individuellen Beiträge – die Bezugsgröße der Signale (AK-4).
   *
   * Nicht das Mittel: Ein einziger Ausreißer zieht das Mittel mit sich, und
   * dann weichen plötzlich **alle** ab. Der Median bleibt liegen, wo das Team
   * liegt, und die Abweichung fällt dem zu, der abweicht – dieselbe Überlegung
   * wie bei der Tendenz (FA-51).
   */
  bezug: number | null;
  /** Abstand zwischen höchstem und niedrigstem individuellen Beitrag. */
  spanne: number | null;
  personen: Personensignal[];
}

/**
 * Agiert das Team als Team (FA-79)?
 *
 * **Eine Aussage über das Team**, getragen von den Werten der Personen – nicht
 * ein Urteil über eine Person (AK-1). Gelesen wird die Verteilung: Dass die
 * Gleichverteilung der Beiträge etwas trägt, wo die Einzelzahl nichts trägt,
 * ist der empirische Befund hinter dieser Anforderung (Fachkonzept 14.4, E1a
 * und E3).
 *
 * Rechnet **nichts in die Note** (AK-7): Es wird nur gelesen, was erfasst ist.
 */
export function befund(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
  bewertungen: Map<string, Bewertung>,
): Befund {
  const schwelle = istZahl(daten.befundSchwelle) ? daten.befundSchwelle : BEFUND_SCHWELLE;
  const mitglieder = mitgliederIn(daten, abschnitt.id, teamId);
  const ergebnisse = mitglieder.map((person) => ({
    person,
    ergebnis: abschnittsErgebnis(daten, abschnitt, person, bewertungen),
  }));

  const teamProzent = ergebnisse[0]?.ergebnis.team?.prozent ?? null;
  const werte = ergebnisse
    .map((e) => e.ergebnis.individuell?.prozent ?? null)
    .filter((w): w is number => w !== null);
  const bezug = werte.length > 0 ? median(werte) : null;
  const spanne = werte.length > 1 ? Math.max(...werte) - Math.min(...werte) : null;

  const peerWerte = ergebnisse
    .map((e) => e.ergebnis.peer?.prozent ?? null)
    .filter((w): w is number => w !== null);
  const peerBezug = peerWerte.length > 1 ? median(peerWerte) : null;

  const personen: Personensignal[] = ergebnisse.map(({ person, ergebnis }) => {
    const individuell = ergebnis.individuell?.prozent ?? null;
    // Erstes Signal: Abstand zum **Mittelwert der Mitglieder** (AK-4).
    //
    // Nicht zum Team-Ergebnis: Das liegt bei einem guten Team nahe 100 %, also
    // könnte niemand fünfzehn Prozentpunkte darüber liegen – die Abweichung
    // nach oben (AK-3) wäre strukturell nie erfüllbar. Der Abstand zum
    // Team-Ergebnis bleibt als Anzeigegröße erhalten.
    const abstand = individuell !== null && bezug !== null ? individuell - bezug : null;
    const abstandTeam =
      individuell !== null && teamProzent !== null ? individuell - teamProzent : null;
    const peer = ergebnis.peer?.prozent ?? null;
    const peerAbstand = peer !== null && peerBezug !== null ? peer - peerBezug : null;
    // Drittes Signal: Eine fehlende Spur zählt ab dem ersten abgeschlossenen
    // Sprint. Sie kann nur nach unten zeigen – wer nichts gezeigt hat, trägt
    // das Team nicht.
    const ohneSpur = abschnitteOhneSpur(daten, person.id, abschnitt.klasseId, teamId);

    const zaehle = (richtung: 'unter' | 'ueber') => {
      const vorzeichen = richtung === 'unter' ? -1 : 1;
      let signale = 0;
      if (abstand !== null && vorzeichen * abstand >= schwelle) signale += 1;
      if (peerAbstand !== null && vorzeichen * peerAbstand >= schwelle) signale += 1;
      if (richtung === 'unter' && ohneSpur > 0) signale += 1;
      return signale;
    };
    const unten = zaehle('unter');
    const oben = zaehle('ueber');
    const signale = Math.max(unten, oben);
    const richtung = signale === 0 ? null : unten >= oben ? 'unter' : 'ueber';
    // AK-4c: Ein Abstand von mindestens der doppelten Schwelle trägt allein.
    // Fünfzehn Prozentpunkte können ein schwacher Sprint sein, fünfzig nicht –
    // und solange die Peer-Bewertung noch nicht läuft, bliebe sonst nur ein
    // Signal übrig und „zwei von drei“ könnte nie ansprechen.
    const deutlich = abstand !== null && Math.abs(abstand) >= 2 * schwelle;

    return {
      person,
      individuell,
      abstand,
      abstandTeam,
      peerAbstand,
      ohneSpur,
      signale,
      richtung,
      auffaellig: signale >= 2 || deutlich,
    };
  });

  const muster: Muster =
    werte.length < 2
      ? 'unklar'
      : personen.some((p) => p.auffaellig)
        ? 'ungleich'
        : bezug !== null && bezug < genuegendGrenze(daten.notenschluessel)
          ? 'zusammen-schwach'
          : 'zusammen';

  return { muster, schwelle, teamProzent, bezug, spanne, personen };
}

/* -------------------------------------------------------------------------- */
/* Vorschlag für die Versionsverwaltung aus der GitHub-Auswertung (FA-81)      */
/* -------------------------------------------------------------------------- */

export interface Versionsvorschlag {
  /** Vorgeschlagener Punktewert. */
  punkte: number;
  max: number;
  /** Anteil der Änderungen über Pull Requests mit Review, in Prozent. */
  prAnteil: number;
  /** Anteil der Kennungen, die mindestens ein Review gegeben haben, in Prozent. */
  reviewBeteiligung: number;
  direktePushes: number;
}

/**
 * Vorschlag für das Team-Kriterium „Versionsverwaltung“ (FA-81 AK-5).
 *
 * Er deckt **nur den mechanisch beobachtbaren Teil** des Kriteriums: PR-Anteil
 * und Review-Beteiligung, je zur Hälfte. „Aussagekräftige Commits“ bleibt
 * Urteil der Lehrkraft – ein Skript kann es nicht beurteilen, und für die
 * Qualität von Commit-Nachrichten ist kein Zusammenhang mit der Leistung
 * nachweisbar (Fachkonzept 14.4, E1).
 *
 * Dass hier überhaupt ein Vorschlag zulässig ist, liegt daran, dass Kennzahl
 * und Kriterium **dasselbe Konstrukt** sind: Der PR-Anteil ist kein
 * Stellvertreter für „Pull Requests mit Review“, er ist es.
 */
export function versionsverwaltungVorschlag(
  auswertung: GithubAuswertung | undefined,
  max: number,
): Versionsvorschlag | null {
  if (!auswertung || !istZahl(max) || max <= 0) return null;
  const kennungen = Object.keys(auswertung.anteile);
  if (kennungen.length === 0) return null;

  const prAnteil = istZahl(auswertung.prAnteil) ? Math.min(100, Math.max(0, auswertung.prAnteil)) : 0;
  const gebend = new Set(
    (auswertung.reviews ?? []).filter((k) => k.anzahl > 0).map((k) => k.von),
  );
  const reviewBeteiligung = (100 * kennungen.filter((k) => gebend.has(k)).length) / kennungen.length;

  const punkte = Math.round(((prAnteil / 100) * (max / 2) + (reviewBeteiligung / 100) * (max / 2)) * 2) / 2;
  return {
    punkte: Math.min(max, Math.max(0, punkte)),
    max,
    prAnteil,
    reviewBeteiligung,
    direktePushes: istZahl(auswertung.direktePushes) ? auswertung.direktePushes : 0,
  };
}

/**
 * Steht der Abschluss dieses Sprints an (FA-77 AK-5)?
 *
 * Erfüllt, wenn für **dieses Team** jedes Mitglied ein Ergebnis hat und der
 * Sprint noch nicht abgeschlossen ist. Das ist ein **Vorschlag**, keine
 * Automatik: Abgeschlossen wird mit einer ausdrücklichen Handlung. Ein bewusst
 * leer gelassenes Feld hält den nächsten Sprint deshalb nicht auf – es
 * verhindert nur, dass der Abschluss von selbst angeboten wird.
 */
export function abschlussFaellig(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
  bewertungen: Map<string, Bewertung>,
): boolean {
  if (abschnitt.art !== 'sprint' || !teamId) return false;
  if (planungVon(daten, abschnitt.id, teamId)?.abgeschlossenAm) return false;
  const mitglieder = mitgliederIn(daten, abschnitt.id, teamId);
  if (mitglieder.length === 0) return false;
  return mitglieder.every(
    (person) => abschnittsErgebnis(daten, abschnitt, person, bewertungen).prozent !== null,
  );
}

/**
 * Ist die Bewertung dieses Abschnitts abgeschlossen (FA-53 AK-1)?
 *
 * Gemessen an dem, was erfasst ist – nicht an einem Schalter „fertig“: Der
 * Abschnitt gilt als abgeschlossen, wenn es mindestens ein Team gibt und jedes
 * Mitglied jedes Teams ein Ergebnis hat. Ein Team ohne Mitglieder zählt nicht
 * als erledigt, sondern als unvollständig.
 */
export function abschnittAbgeschlossen(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  bewertungen: Map<string, Bewertung>,
): boolean {
  const teams = teamsIn(daten, abschnitt.id);
  if (teams.length === 0) return false;

  return teams.every((team) => {
    const mitglieder = mitgliederIn(daten, abschnitt.id, team.id);
    if (mitglieder.length === 0) return false;
    return mitglieder.every(
      (person) => abschnittsErgebnis(daten, abschnitt, person, bewertungen).prozent !== null,
    );
  });
}

/**
 * Steht die Nachfrage zur Peer-Bewertung an (FA-53)?
 *
 * Sie steht an, wenn die Bewertung abgeschlossen ist (AK-1), die
 * Peer-Bewertung noch nicht läuft (AK-2) und für diesen Abschnitt noch keine
 * Antwort vorliegt – auch ein „später“ zählt als Antwort und lässt die Frage
 * bis zum nächsten Abschnitt ruhen (AK-3). Für einen Test entfällt sie: dort
 * gibt es kein Team, das sich gegenseitig einschätzen könnte.
 */
export function peerFrageFaellig(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  bewertungen: Map<string, Bewertung>,
): boolean {
  if (abschnitt.art === 'test' || abschnitt.peerAktiv) return false;
  if (daten.peerEntscheidungen.some((e) => e.abschnittId === abschnitt.id)) return false;
  return abschnittAbgeschlossen(daten, abschnitt, bewertungen);
}

/**
 * Zeitfaktoren für `anzahl` Abschnitte eines Beurteilungszeitraums (FA-54).
 *
 * Die zweite Hälfte trägt den höheren Faktor; bei ungerader Zahl wird
 * **zugunsten der späteren** aufgerundet – bei fünf Abschnitten tragen drei
 * den Faktor 2 (AK-2). Das ist § 20 Abs. 1 LBVO: Maßgeblich ist der zuletzt
 * erreichte Leistungsstand, nicht der Durchschnitt.
 */
export function zeitfaktoren(anzahl: number, faktorZweiteHaelfte = ZEITFAKTOR_ZWEITE_HAELFTE): number[] {
  if (anzahl <= 0) return [];
  const faktor = istZahl(faktorZweiteHaelfte) ? Math.max(0, faktorZweiteHaelfte) : 1;
  const zweiteHaelfte = Math.ceil(anzahl / 2);
  return Array.from({ length: anzahl }, (_, i) => (i >= anzahl - zweiteHaelfte ? faktor : 1));
}

/**
 * Weicht der eingestellte Zeitfaktor von § 20 Abs. 1 LBVO ab (FA-54 AK-6)?
 *
 * Zulässig ist das – die Anwendung soll es aber benennen, statt es
 * stillschweigend hinzunehmen.
 */
export function zeitfaktorWeichtAb(faktor: number): boolean {
  return faktor <= 1;
}

/**
 * Mittelt Abschnittsergebnisse mit dem **Produkt** aus Abschnittsfaktor und
 * Zeitfaktor (FA-24 AK-3, FA-54 AK-4).
 */
function gewichtetesMittel(eintraege: AbschnittMitErgebnis[]): number | null {
  let gewichtssumme = 0;
  let summe = 0;
  for (const eintrag of eintraege) {
    if (eintrag.ergebnis.prozent === null) continue;
    const faktor = istZahl(eintrag.abschnitt.faktor) ? Math.max(0, eintrag.abschnitt.faktor) : 1;
    const gewicht = faktor * eintrag.zeitfaktor;
    if (gewicht === 0) continue;
    gewichtssumme += gewicht;
    summe += gewicht * eintrag.ergebnis.prozent;
  }
  return gewichtssumme > 0 ? summe / gewichtssumme : null;
}

/** Stand einer Person in einem Strang (FA-59 AK-2). */
export function strangErgebnis(
  daten: Datenbestand,
  person: Person,
  strang: Strang,
  bewertungen: Map<string, Bewertung>,
  zeitraum: Zeitraum = { von: null, bis: null },
): Strangergebnis {
  const imStrang = abschnitteVon(daten, person.klasseId).filter(
    (a) =>
      a.strang === strang &&
      // OP-F17: Jedes Team hat seine eigenen Sprints. Was diese Person nie
      // hatte, gehört auch nicht in ihre Zeitreihe.
      gehoertZu(daten, a, person.id) &&
      imZeitraumFuer(daten, a, person.id, zeitraum),
  );
  // Der Zeitfaktor ergibt sich aus der Lage **innerhalb des Strangs** und
  // innerhalb der eigenen Abschnitte: Ein Test und ein Sprint liegen in
  // verschiedenen Zeitreihen (FA-54 AK-3, FA-59), und die Sprints eines
  // anderen Teams gehören in gar keine.
  //
  // Ohne diese zweite Einschränkung fiele der Zeitfaktor dort ganz aus, wo alle
  // Sprints eines Teams in derselben Hälfte der Klassenliste liegen: Ein
  // gemeinsamer Faktor kürzt sich aus dem gewichteten Mittel heraus (TF-N,
  // TF-O).
  const faktoren = zeitfaktoren(imStrang.length, daten.zeitfaktorZweiteHaelfte);
  const abschnitte = imStrang.map((abschnitt, i) => ({
    abschnitt,
    ergebnis: abschnittsErgebnis(daten, abschnitt, person, bewertungen),
    zeitfaktor: faktoren[i] ?? 1,
  }));
  return { strang, prozent: gewichtetesMittel(abschnitte), abschnitte };
}

/**
 * Gesamtstand einer Person (FA-24, FA-59 AK-3).
 *
 * Gewichtetes Mittel der beiden Strangstände, Vorgabe 75 zu 25. Ein Strang
 * ohne jedes Ergebnis fällt aus der Gewichtung, statt als 0 zu zählen
 * (FA-59 AK-5) – sonst zeigte die Anwendung im Oktober, wenn noch kein Test
 * geschrieben wurde, einen um ein Viertel gedrückten Wert.
 */
export function gesamtErgebnis(
  daten: Datenbestand,
  person: Person,
  bewertungen: Map<string, Bewertung>,
  stichtagId: Id | null = null,
): Gesamtergebnis {
  // FA-48: Ohne Stichtag ist der Zeitraum offen – dann zählt alles. Mit
  // Stichtag wird der Zeitfaktor **innerhalb** des Zeitraums neu bestimmt
  // (FA-54 AK-3): Ein Semester ist eine eigene Zeitreihe.
  const zeitraum = zeitraumVon(daten, stichtagId);
  const praxis = strangErgebnis(daten, person, 'praxis', bewertungen, zeitraum);
  const theorie = strangErgebnis(daten, person, 'theorie', bewertungen, zeitraum);

  let gewichtssumme = 0;
  let summe = 0;
  for (const strang of [praxis, theorie]) {
    if (strang.prozent === null) continue;
    const gewicht = Math.max(0, daten.strangGewichte[strang.strang] ?? 0);
    if (gewicht === 0) continue;
    gewichtssumme += gewicht;
    summe += gewicht * strang.prozent;
  }

  const alle = [...praxis.abschnitte, ...theorie.abschnitte].sort(
    (a, b) => a.abschnitt.nummer - b.abschnitt.nummer,
  );

  const berechnet = gewichtssumme > 0 ? summe / gewichtssumme : null;
  const schluessel = stichtagId ?? OHNE_STICHTAG;
  const gesetzt = daten.gesamtstand?.[schluessel]?.[person.id] ?? null;
  const notenstand = daten.notenstaende?.[schluessel]?.[person.id] ?? null;

  return {
    prozent: gesetzt ? klemme(gesetzt.prozent, 0, 100) : berechnet,
    prozentBerechnet: berechnet,
    gesetzt,
    notenstand,
    praxis,
    theorie,
    alle,
    auslassung: { ohneDatum: auslassungen(daten, person, zeitraum) },
  };
}

/* -------------------------------------------------------------------------- */
/* Eingefrorene Rubrik angleichen (FA-47)                                      */
/* -------------------------------------------------------------------------- */

/** Was sich für eine Person ändern würde. */
export interface Angleichungsfolge {
  person: Person;
  vorher: number | null;
  nachher: number | null;
}

export interface Angleichung {
  abschnitt: Abschnitt;
  /**
   * Das betroffene Team (FA-47 AK-6); `null` bei einer Kopie am Abschnitt –
   * also bei einem Test oder einem Bestand vor Schemastand 3.
   */
  teamId: Id | null;
  /** Name des Teams, für die Vorschau. */
  teamname: string | null;
  /**
   * Nur Bezeichnungen und Beschreibungen betroffen (FA-47 AK-3)?
   *
   * Verglichen werden Kennungen, Maximalpunkte, Gewichte und `selbstZaehlt` –
   * alles, was rechnet. Ist das gleich, kann sich kein Prozentwert ändern.
   */
  nurTexte: boolean;
  folgen: Angleichungsfolge[];
}

/** Der rechnende Teil einer Rubrik, ohne Namen und Beschreibungen. */
function rechenkern(rubrik: Rubrik): string {
  const kategorien = (['team', 'prozess', 'individuell', 'peer'] as const).map((k) =>
    rubrik[k].map((kriterium) => `${kriterium.id}:${kriterium.max}`).join(','),
  );
  return JSON.stringify([kategorien, rubrik.gewichte, rubrik.selbstZaehlt]);
}

/**
 * Was ein Angleichen an die aktuelle Rubrik bewirken würde (FA-47 AK-2).
 *
 * Betroffen sind nur Abschnitte, die dieser Rubrik zugeordnet sind **und**
 * bereits eine eingefrorene Kopie tragen – bei allen anderen wirkt eine
 * Rubrikänderung ohnehin (FA-65) und es gibt nichts anzugleichen.
 *
 * Die Funktion rechnet nur; sie verändert nichts.
 */
export function angleichungsVorschau(
  daten: Datenbestand,
  rubrikId: Id,
  bewertungen: Map<string, Bewertung>,
): Angleichung[] {
  const aktuell = daten.rubriken.find((r) => r.id === rubrikId);
  if (!aktuell) return [];

  // Kandidaten: Kopien am Abschnitt (Tests, Altbestand) und Planungen, deren
  // Kriterien aus **dieser** Rubrik stammen. Ein fortgeschriebener oder
  // geänderter Satz ist eine Entscheidung des Teams und wird nicht eingeebnet
  // (FA-47 AK-6).
  const kandidaten: Array<{ abschnitt: Abschnitt; teamId: Id | null; kopie: Rubrik }> = [];
  for (const abschnitt of daten.abschnitte) {
    if (abschnitt.rubrikId !== rubrikId) continue;
    if (abschnitt.rubrikKopie) {
      kandidaten.push({ abschnitt, teamId: null, kopie: abschnitt.rubrikKopie });
    }
    for (const planung of daten.teamabschnitte ?? []) {
      if (planung.abschnittId !== abschnitt.id || !planung.rubrikKopie) continue;
      if (planung.herkunft?.art !== 'vorlage' || planung.herkunft.rubrikId !== rubrikId) continue;
      kandidaten.push({ abschnitt, teamId: planung.teamId, kopie: planung.rubrikKopie });
    }
  }

  return kandidaten
    .filter(({ kopie }) => JSON.stringify(kopie) !== JSON.stringify(aktuell))
    .map(({ abschnitt, teamId, kopie }) => {
      const nurTexte = rechenkern(kopie) === rechenkern(aktuell);
      const teamname = daten.teams.find((t) => t.id === teamId)?.name ?? null;

      const folgen = daten.personen
        .filter((p) => p.klasseId === abschnitt.klasseId)
        .map((person) => {
          const inTeam = abschnitt.art === 'test' ? null : teamIn(daten, abschnitt.id, person.id);
          const bewertung = bewertungen.get(bewertungsSchluessel(abschnitt.id, inTeam));
          const mitglieder = mitgliederIn(daten, abschnitt.id, inTeam);
          const wie = (rubrik: Rubrik) =>
            ergebnisAusRubrik(
              bewertung,
              person,
              mitglieder,
              rubrik,
              abschnitt.peerAktiv,
              daten.peerDeckelung,
              daten.verstehensAnteil,
            ).prozent;
          return { person, vorher: wie(kopie), nachher: wie(aktuell) };
        })
        // Wer zu dieser Kopie nicht gehört, ist nicht betroffen.
        .filter((f) => teamId === null || teamIn(daten, abschnitt.id, f.person.id) === teamId)
        // Wer kein Ergebnis hat und keines bekommt, ist nicht betroffen.
        .filter((f) => f.vorher !== null || f.nachher !== null);

      return { abschnitt, teamId, teamname, nurTexte, folgen };
    });
}

/** Ändert das Angleichen einen Prozentwert (FA-47 AK-3)? */
export function angleichungAendertWerte(angleichungen: Angleichung[]): boolean {
  return angleichungen.some((a) =>
    a.folgen.some((f) => {
      if (f.vorher === null || f.nachher === null) return f.vorher !== f.nachher;
      return Math.abs(f.vorher - f.nachher) > 0.0001;
    }),
  );
}

/* -------------------------------------------------------------------------- */
/* Vergleichbarkeit zwischen den Teams (FA-67 AK-6)                            */
/* -------------------------------------------------------------------------- */

/**
 * Beurteilen die Teams dieses Abschnitts nach verschiedenen Kriterien?
 *
 * Verglichen wird der **rechnende** Teil: Kennungen, Maximalpunkte, Gewichte.
 * Verschiedene Beschreibungen desselben Kriteriums ändern keinen Prozentwert
 * und machen einen Vergleich nicht schief.
 */
export function kriterienWeichenAb(daten: Datenbestand, abschnitt: Abschnitt): boolean {
  if (abschnitt.art === 'test') return false;
  const teams = teamsIn(daten, abschnitt.id);
  if (teams.length < 2) return false;
  const kerne = new Set(teams.map((t) => rechenkern(rubrikFuer(daten, abschnitt, t.id))));
  return kerne.size > 1;
}

/**
 * Abschnitte, in denen die Teams nach verschiedenen Kriterien beurteilt wurden.
 *
 * Überall, wo Teams verglichen werden, ist das auszuweisen: Ein Vergleich
 * ungleicher Maßstäbe ohne Hinweis wäre irreführend (FA-67 AK-6).
 */
export function abschnitteMitAbweichung(
  daten: Datenbestand,
  abschnitte: Abschnitt[],
): Abschnitt[] {
  return abschnitte.filter((a) => kriterienWeichenAb(daten, a));
}

/**
 * Ab wie vielen Prozentpunkten Unterschied von einer Tendenz gesprochen wird.
 *
 * Darunter ist es Rauschen: Ein Abschnitt schwankt aus Gründen, die nichts mit
 * einer Entwicklung zu tun haben.
 */
export const TENDENZ_SCHWELLE = 5;

export type Tendenz = 'steigend' | 'fallend' | 'gleich';

/** Median einer nicht leeren Werteliste. */
function median(werte: number[]): number {
  const sortiert = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(sortiert.length / 2);
  return sortiert.length % 2 === 1
    ? sortiert[mitte]
    : (sortiert[mitte - 1] + sortiert[mitte]) / 2;
}

/**
 * Wohin sich eine Person entwickelt (FA-51 AK-1).
 *
 * Verglichen werden die **Mediane der beiden Hälften** des Verlaufs, geteilt
 * wie beim Zeitfaktor (FA-54): zweite Hälfte aufgerundet.
 *
 * *Warum nicht der letzte Wert gegen das Mittel der früheren:* Ein einzelner
 * Ausfall verschiebt dann die Aussage, und zwar in beide Richtungen. Liegt er
 * früh, sieht ein unveränderter Verlauf wie ein Anstieg aus (TF-F); liegt er
 * spät, wie ein Absturz (TF-G). Gegen die neun Verläufe aus
 * `docs/testfaelle-notenfindung.md` geprüft, trifft der Median beide Fälle
 * richtig und das Mittel nicht.
 *
 * `null`, solange es weniger als zwei bewertete Abschnitte gibt: Aus einem
 * Punkt lässt sich keine Richtung ablesen.
 */
export function tendenz(eintraege: AbschnittMitErgebnis[]): Tendenz | null {
  const werte = eintraege
    .map((e) => e.ergebnis.prozent)
    .filter((wert): wert is number => wert !== null);
  if (werte.length < 2) return null;

  const zweite = Math.ceil(werte.length / 2);
  const abstand = median(werte.slice(werte.length - zweite)) - median(werte.slice(0, werte.length - zweite));
  if (Math.abs(abstand) < TENDENZ_SCHWELLE) return 'gleich';
  return abstand > 0 ? 'steigend' : 'fallend';
}

/** Bezeichnungen der Kategorien, zu denen in einem Abschnitt nichts erfasst ist. */
export function offeneKategorien(eintraege: AbschnittMitErgebnis[]): string[] {
  const gesehen = new Set<string>();
  for (const eintrag of eintraege) {
    for (const name of eintrag.ergebnis.fehlend) gesehen.add(name);
  }
  return [...gesehen];
}

/**
 * Untere Grenze für ein „Genügend“ aus dem Notenschlüssel (FA-61).
 *
 * Die Grenze der Note 4; fehlt sie, greift die Vorgabe 51 %.
 */
export function genuegendGrenze(notenschluessel: Notenstufe[]): number {
  const stufe = notenschluessel.find((n) => n.note === 4);
  return stufe && istZahl(stufe.ab) ? stufe.ab : 51;
}

/**
 * Der Notenvorschlag samt Grund (FA-25, FA-61).
 *
 * Die Sperre ist ein **Prädikat über den Strangständen**, keine Rechenoperation:
 * Sie verändert keinen gespeicherten Wert (AK-3) und keinen der beiden
 * Strangstände. Ein Strang **ohne Ergebnis** löst sie nicht aus – alles andere
 * würde eine noch nicht erhobene Leistung als misslungen werten und im Oktober
 * jedem Schüler ein Nicht genügend anzeigen (Testfall TF-L).
 *
 * Rechtsgrundlage § 14 LBVO: „Genügend“ verlangt die Erfüllung in den
 * wesentlichen Bereichen; ein nicht bestandener Strang ist ein solcher Bereich.
 */
export function notenvorschlag(
  gesamt: Gesamtergebnis,
  notenschluessel: Notenstufe[],
  sperreAktiv = true,
): Notenvorschlag {
  const ohneSperre = note(gesamt.prozent, notenschluessel);
  if (!sperreAktiv) return { note: ohneSperre, gesperrtDurch: null, ohneSperre };

  const grenze = genuegendGrenze(notenschluessel);
  // Reihenfolge fest: Praxis vor Theorie – damit die Begründung bei zwei
  // negativen Strängen nicht von der Aufzählungsreihenfolge abhängt.
  const gesperrtDurch =
    gesamt.praxis.prozent !== null && gesamt.praxis.prozent < grenze
      ? 'praxis'
      : gesamt.theorie.prozent !== null && gesamt.theorie.prozent < grenze
        ? 'theorie'
        : null;

  if (gesperrtDurch === null) return { note: ohneSperre, gesperrtDurch: null, ohneSperre };
  return { note: 5, gesperrtDurch, ohneSperre };
}

/**
 * Weicht der eingetragene Notenstand vom Vorschlag ab (FA-49 AK-3)?
 *
 * Beide Werte bleiben erhalten; die Abweichung ist nur festzustellen, nicht
 * aufzulösen – sie ist der Normalfall, sobald die Lehrkraft entscheidet.
 */
export function notenstandWeichtAb(
  notenstand: Notenstand | null,
  vorschlag: Notenvorschlag,
): boolean {
  return notenstand !== null && vorschlag.note !== null && notenstand.note !== vorschlag.note;
}

/**
 * Liegt dieser Strangstand unter der Genügend-Grenze (FA-61 AK-5)?
 *
 * Für die Frühwarnung: erkennbar, **bevor** der Beurteilungszeitraum endet.
 */
export function strangUnterGrenze(stand: number | null, notenschluessel: Notenstufe[]): boolean {
  return stand !== null && stand < genuegendGrenze(notenschluessel);
}

/**
 * Weicht die Selbsteinschätzung deutlich von der Fremdeinschätzung ab (FA-27)?
 *
 * Gibt zurück, in welche Richtung – oder `null`, wenn einer der beiden Werte
 * fehlt oder die Abweichung unter der Schwelle liegt.
 */
export function selbstbildAbweichung(ergebnis: Abschnittsergebnis): 'hoeher' | 'niedriger' | null {
  if (ergebnis.selbst === null || ergebnis.peer === null) return null;
  const abstand = ergebnis.selbst - ergebnis.peer.prozent;
  if (Math.abs(abstand) < ABWEICHUNG_SCHWELLE) return null;
  return abstand > 0 ? 'hoeher' : 'niedriger';
}

/**
 * Schlüssel einer Bewertung im Datenbestand.
 *
 * `null` als Team steht für einen Abschnitt ohne Team – bei einem Test gibt es
 * genau eine Bewertung je Abschnitt, in der die Punkte je Person liegen.
 */
export function bewertungsSchluessel(abschnittId: Id, teamId: Id | null): string {
  return `${abschnittId}__${teamId ?? '-'}`;
}

/**
 * Note zu einem Prozentwert (FA-25).
 *
 * Es gilt die beste Note, deren untere Grenze erreicht ist. Ohne Prozentwert
 * gibt es keine Note. Der Wert ist ein **Vorschlag** und wird nie gespeichert
 * (G8, FA-25 AK-3).
 */
export function note(prozent: number | null, notenschluessel: Notenstufe[]): number | null {
  if (prozent === null || !istZahl(prozent) || notenschluessel.length === 0) return null;
  const absteigend = [...notenschluessel].sort((a, b) => b.ab - a.ab);
  for (const stufe of absteigend) {
    if (prozent >= stufe.ab) return stufe.note;
  }
  return absteigend[absteigend.length - 1].note;
}

/**
 * Ein ISO-Datum (JJJJ-MM-TT) in deutscher Schreibweise.
 *
 * Die Datumsfelder der Oberfläche liefern ISO; angezeigt und ausgegeben wird,
 * was hierzulande lesbar ist. Ein leerer oder unerwarteter Wert kommt
 * unverändert zurück – hier wird nichts geraten.
 */
export function datumDeutsch(iso: string): string {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return treffer ? `${treffer[3]}.${treffer[2]}.${treffer[1]}` : iso;
}

/** Formatiert einen Prozentwert für die Anzeige (deutsche Schreibweise). */
export function formatProzent(wert: number | null, nachkommastellen = 0): string {
  if (wert === null || !istZahl(wert)) return '–';
  return wert.toLocaleString('de-AT', {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  });
}
