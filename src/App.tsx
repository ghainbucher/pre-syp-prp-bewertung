/**
 * Rahmen der Anwendung: Datenbestand laden und speichern, Ansicht wählen,
 * Sicherung erzeugen und einlesen.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { leererDatenbestand } from './domain/defaults';
import type { Datenbestand } from './domain/types';
import { AuswertungAnsicht } from './ansichten/AuswertungAnsicht';
import { RubrikAnsicht } from './ansichten/RubrikAnsicht';
import {
  DailyAnsicht,
  DiplomarbeitAnsicht,
  SprintplanningAnsicht,
  SprintreviewAnsicht,
} from './ansichten/SprintAnsicht';
import { ProjektAnsicht } from './ansichten/ProjektAnsicht';
import { KlassenAnsicht } from './ansichten/KlassenAnsicht';
import { ProjektStammdatenAnsicht } from './ansichten/ProjektStammdatenAnsicht';
import { SchuelerAnsicht } from './ansichten/SchuelerAnsicht';
import { StichtagAnsicht } from './ansichten/StichtagAnsicht';
import { TestStammdatenAnsicht } from './ansichten/TestStammdatenAnsicht';
import { TestAnsicht } from './ansichten/TestAnsicht';
import { dateiAnbieten } from './export/csv';
import {
  alsSicherung,
  ausSicherung,
  laden,
  loeschen,
  sicherungsDateiname,
  speichern,
} from './store/persistence';
import {
  berechtigungPruefen,
  inOrdnerSchreiben,
  ordnerHolen,
  ordnerMerken,
  ordnerVergessen,
  ordnerWaehlen,
  ordnerwahlMoeglich,
  type Zielordner,
} from './store/ordner';
import {
  aenderungVermerken,
  automatikText,
  sicherungVermerken,
  sicherungsHinweis,
  standLesen,
  standLoeschen,
  standSchreiben,
  standText,
  type Sicherungsstand,
} from './store/sicherung';
import { storeReducer } from './store/storeReducer';
import { auswahlKorrigieren, klassen as alleKlassen } from './ui/auswahl';
import { BestaetigenSchalter } from './ui/bausteine';
import { useUiZustand, type Ansicht, type Stammseite } from './ui/useUiZustand';

/**
 * Die vier Hauptbereiche (FA-34 AK-1).
 *
 * Zwei Leistungsbereiche – **Projekte** und **Tests** (Fachkonzept 15.2, A1) –,
 * die **Notenauswertung**, die beide zusammenführt, und die **Stammdaten**, die
 * tragen, was dafür gepflegt wird.
 *
 * Die Reihenfolge folgt der **Häufigkeit der Benutzung**, nicht dem Ablauf
 * (AK-2, Fachkonzept A6): In Projekten wird wöchentlich gearbeitet, Stammdaten
 * werden dreimal im Jahr gepflegt.
 */
const ANSICHTEN: Array<{ id: Ansicht; nr: string; titel: string }> = [
  { id: 'projekte', nr: '01', titel: 'Projekte' },
  { id: 'tests', nr: '02', titel: 'Tests' },
  { id: 'auswertung', nr: '03', titel: 'Notenauswertung' },
  { id: 'stammdaten', nr: '04', titel: 'Stammdaten' },
];

/**
 * Die Teile eines Abschnitts (FA-91 AK-4).
 *
 * Sie gehören zum Projekt und stehen deshalb in einer zweiten, untergeordneten
 * Zeile – **sichtbar nur im Bereich Projekt** (FA-34 AK-5, Festlegung des
 * Auftraggebers vom 13.09.2026). Ein Sprintteil ohne Projekt ist kein Bereich,
 * sondern ein Schritt ohne Gegenstand; in den Stammdaten oder im Notenschlüssel
 * wäre die Zeile vier Knöpfe, die dort nichts zu suchen haben.
 */
const SPRINTTEILE: Array<{ id: Ansicht; titel: string }> = [
  { id: 'planning', titel: 'Sprintplanning' },
  { id: 'daily', titel: 'Daily' },
  { id: 'review', titel: 'Sprintreview' },
  // Steht hier, solange die Diplomarbeitsvorbereitung eine Abschnittsart ist.
  // Mit dem nächsten Schemastand wird sie ein Projekt vom Typ Diplomarbeit und
  // der Eintrag entfällt (FA-34 AK-6). Ihn jetzt zu entfernen hieße, vorhandene
  // Abschnitte unerreichbar zu machen.
  { id: 'diplomarbeit', titel: 'Diplomarbeitsvorbereitung' },
];

/**
 * Die Stammdatenseiten (FA-34 AK-3).
 *
 * **Ein Blatt je Sache.** Klassen und Schüler sind getrennt, weil das eine
 * dreimal im Jahr und das andere laufend gepflegt wird; je Leistungsbereich
 * gibt es eines; Notenschlüssel und Stichtage gelten für beide und stehen
 * daneben.
 */
const STAMMSEITEN: Array<{ id: Stammseite; titel: string }> = [
  { id: 'klassen', titel: 'Klassen' },
  { id: 'schueler', titel: 'Schüler' },
  { id: 'projekte', titel: 'Projekte' },
  { id: 'tests', titel: 'Tests' },
  { id: 'rubrik', titel: 'Rubrik & Notenschlüssel' },
  { id: 'stichtage', titel: 'Stichtage' },
];

const start = laden();
const startSicherung = standLesen();

export function App() {
  const [daten, dispatch] = useReducer(storeReducer, start.daten);
  const [ui, setUi] = useUiZustand();
  const [meldung, setMeldung] = useState<string | null>(start.warnung);
  const [gespeichert, setGespeichert] = useState(true);
  const [sicherung, setSicherung] = useState(startSicherung);
  // Welche Hinweisstufe wurde weggeklickt? Wird die Lage dringender, meldet
  // sich der Hinweis erneut (FA-46 AK-2, AK-5).
  const [abgewiesen, setAbgewiesen] = useState<string | null>(null);
  // Der gewählte Zielordner (FA-64). Der Handle ist kein Wert zum Anzeigen,
  // deshalb ein Ref – der sichtbare Zustand steht im Sicherungsstand.
  const zielordner = useRef<Zielordner | null>(null);
  const automatikOffen = useRef(false);
  const dateiwahl = useRef<HTMLInputElement>(null);
  // Für das Sichern beim Verlassen der Seite: der jeweils letzte Stand und ob
  // er noch ungeschrieben ist.
  const datenRef = useRef(daten);
  const offen = useRef(false);

  /**
   * Stand fortschreiben und ablegen – immer beides, nie nur eines.
   *
   * Als `useCallback` mit leerer Abhängigkeitsliste: Die Funktion hängt nur an
   * `setSicherung` und bleibt damit stabil, sodass die Effekte unten sie
   * ordentlich als Abhängigkeit führen können, statt die Regel abzuschalten.
   */
  const standSetzen = useCallback(
    (aenderung: (vorher: Sicherungsstand) => Sicherungsstand) => {
      setSicherung((vorher) => {
        const neu = aenderung(vorher);
        standSchreiben(neu);
        return neu;
      });
    },
    [],
  );

  // Beim Start den gemerkten Ordner holen. Die Berechtigung wird hier nur
  // *abgefragt*, nicht erbeten: Ohne Nutzerhandlung lehnt der Browser eine
  // Nachfrage ab (FA-64 AK-6).
  useEffect(() => {
    let abgebrochen = false;
    void (async () => {
      const ordner = await ordnerHolen();
      if (abgebrochen || !ordner) return;
      zielordner.current = ordner;
      const berechtigung = await berechtigungPruefen(ordner);
      if (abgebrochen) return;
      standSetzen((vorher) => ({
        ...vorher,
        ordnerName: ordner.name,
        automatisch: berechtigung === 'granted' ? 'ok' : 'freigabe',
        fehlermeldung: null,
      }));
    })();
    return () => {
      abgebrochen = true;
    };
  }, [standSetzen]);

  // Speichern, entprellt – jede Änderung wird ohne ausdrückliches Speichern
  // übernommen (FA-19).
  useEffect(() => {
    setGespeichert(false);
    offen.current = true;
    datenRef.current = daten;
    const zeitgeber = setTimeout(() => {
      const erfolg = speichern(daten);
      offen.current = !erfolg;
      setGespeichert(erfolg);
      if (erfolg) {
        standSetzen((vorher) => aenderungVermerken(vorher));
        automatikOffen.current = true;
      }
      if (!erfolg) {
        setMeldung('Der Datenbestand konnte nicht gespeichert werden. Bitte eine Sicherung anlegen.');
      }
    }, 400);
    return () => clearTimeout(zeitgeber);
  }, [daten, standSetzen]);

  // Beim Verlassen der Seite sofort schreiben. Ohne das verliert die
  // Entprellung jede Änderung, die weniger als 400 ms vor dem Schließen oder
  // Neuladen erfolgt ist – der Nutzer sieht seine Eingabe und sie ist trotzdem
  // weg (Risiko R-01). 'pagehide' ist verlässlicher als 'beforeunload' und
  // greift auch, wenn der Browser die Seite in den Hintergrund legt.
  useEffect(() => {
    const sofortSichern = () => {
      if (!offen.current) return;
      offen.current = !speichern(datenRef.current);
    };
    const beiSichtwechsel = () => {
      if (document.visibilityState === 'hidden') sofortSichern();
    };
    window.addEventListener('pagehide', sofortSichern);
    document.addEventListener('visibilitychange', beiSichtwechsel);
    return () => {
      window.removeEventListener('pagehide', sofortSichern);
      document.removeEventListener('visibilitychange', beiSichtwechsel);
    };
  }, []);

  /**
   * Schreibt die Tagesdatei in den gewählten Ordner (FA-64 AK-2).
   *
   * Gibt zurück, ob geschrieben wurde. Ein Fehlschlag landet im Stand und
   * damit in der Oberfläche – still scheitern darf er nicht (AK-5).
   */
  const inOrdnerSichern = useCallback(async (bestand: Datenbestand): Promise<boolean> => {
    const ordner = zielordner.current;
    if (!ordner) return false;
    const ergebnis = await inOrdnerSchreiben(ordner, sicherungsDateiname(), alsSicherung(bestand));
    if (ergebnis.ok) {
      standSetzen((vorher) => ({
        ...sicherungVermerken(vorher, bestand),
        automatisch: 'ok',
        fehlermeldung: null,
      }));
      setAbgewiesen(null);
      return true;
    }
    standSetzen((vorher) => ({
      ...vorher,
      automatisch: ergebnis.grund === 'berechtigung' ? 'freigabe' : 'fehler',
      fehlermeldung: ergebnis.meldung,
    }));
    return false;
  }, [standSetzen]);

  // Die Tagesdatei wird deutlich träger geschrieben als der Browserspeicher:
  // Eine Datei je Tastendruck bringt nichts und belastet einen Sync-Ordner
  // unnötig. Drei Sekunden nach der letzten Änderung genügt.
  useEffect(() => {
    if (sicherung.automatisch !== 'ok') return;
    const zeitgeber = setTimeout(() => {
      if (!automatikOffen.current) return;
      automatikOffen.current = false;
      void inOrdnerSichern(datenRef.current);
    }, 3000);
    return () => clearTimeout(zeitgeber);
  }, [daten, sicherung.automatisch, inOrdnerSichern]);

  /** Ordner einmal wählen (FA-64 AK-1). Verlangt eine Nutzerhandlung. */
  async function ordnerEinrichten() {
    const ordner = await ordnerWaehlen();
    if (!ordner) return;
    zielordner.current = ordner;
    await ordnerMerken(ordner);
    standSetzen((vorher) => ({
      ...vorher,
      ordnerName: ordner.name,
      automatisch: 'ok',
      fehlermeldung: null,
    }));
    const geschrieben = await inOrdnerSichern(datenRef.current);
    setMeldung(
      geschrieben
        ? `Die Sicherung läuft ab jetzt automatisch nach „${ordner.name}“. Bitte prüfen, dass dieser Ordner im schulischen Speicher liegt (DS-06).`
        : `Der Ordner „${ordner.name}“ ist gewählt, konnte aber noch nicht beschrieben werden.`,
    );
  }

  /** Freigabe einmal je Sitzung bestätigen (FA-64 AK-6). */
  async function ordnerFreigeben() {
    const ordner = zielordner.current;
    if (!ordner) return;
    const berechtigung = await berechtigungPruefen(ordner, true);
    if (berechtigung !== 'granted') {
      standSetzen((vorher) => ({
        ...vorher,
        automatisch: 'fehler',
        fehlermeldung: `Die Schreibberechtigung für „${ordner.name}“ wurde nicht erteilt.`,
      }));
      return;
    }
    standSetzen((vorher) => ({ ...vorher, automatisch: 'ok', fehlermeldung: null }));
    await inOrdnerSichern(datenRef.current);
  }

  /** Automatik wieder abschalten. */
  async function ordnerLoesen() {
    zielordner.current = null;
    await ordnerVergessen();
    standSetzen((vorher) => ({
      ...vorher,
      ordnerName: null,
      automatisch: 'aus',
      fehlermeldung: null,
    }));
  }

  // Auswahl gültig halten, wenn Klassen, Teams oder Abschnitte wegfallen.
  useEffect(() => {
    const korrektur = auswahlKorrigieren(daten, ui);
    if (korrektur) setUi(korrektur);
  }, [daten, ui, setUi]);

  const klassen = alleKlassen(daten);
  const gemeinsam = { daten, dispatch, ui, setUi };

  const hinweis = sicherungsHinweis(sicherung);
  // Die Teile eines Abschnitts gehören zum Projekt: Sie erscheinen im Bereich
  // Projekt und in ihnen selbst, sonst nicht (FA-34 AK-5).
  const istSprintteil = SPRINTTEILE.some((teil) => teil.id === ui.ansicht);
  const imProjekt = ui.ansicht === 'projekte' || istSprintteil;

  function sicherungSpeichern() {
    dateiAnbieten(sicherungsDateiname(), alsSicherung(daten), 'application/json');
    const neu = sicherungVermerken(sicherung, daten);
    standSchreiben(neu);
    setSicherung(neu);
    setAbgewiesen(null);
    setMeldung(
      'Die Sicherung enthält Namen und Noten im Klartext – bitte im schulischen Speicher ablegen und wie eine Notenliste behandeln (DS-06).',
    );
  }

  async function sicherungEinlesen(datei: File) {
    try {
      const inhalt = await datei.text();
      dispatch({ art: 'daten/ersetzen', daten: ausSicherung(inhalt) });
      setMeldung(`Sicherung „${datei.name}“ eingelesen.`);
    } catch (fehler) {
      setMeldung(
        fehler instanceof Error
          ? `Die Datei konnte nicht eingelesen werden: ${fehler.message}`
          : 'Die Datei konnte nicht eingelesen werden.',
      );
    }
  }

  return (
    <>
      <div className="kopfleiste">
        <div className="rahmen">
          <div className="marke">
            <span className="zeichen" />
            PRE/SYP-PRP <small>Bewertung</small>
          </div>
          <span className="dehnen" />
          {/*
            Der Klassenfilter steht in der Kopfleiste und **wirkt auf jeder
            Sicht** (FA-95): Was er ausblendet, ist überall ausgeblendet. Weil
            er über Sichtgrenzen hinweg gilt, muss er auch überall zu sehen und
            zu ändern sein – sonst arbeitet man in einer gefilterten Liste,
            ohne den Filter zu kennen.
          */}
          {klassen.length > 0 ? (
            <div className="zeile">
              <label className="etikett" htmlFor="klassenwahl">
                Klasse
              </label>
              <select
                id="klassenwahl"
                value={ui.klasseId ?? ''}
                onChange={(e) =>
                  setUi({ klasseId: e.target.value || null, abschnittId: null, teamId: null })
                }
              >
                <option value="">alle Klassen</option>
                {klassen.map((klasse) => (
                  <option key={klasse.id} value={klasse.id}>
                    {klasse.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className={gespeichert ? 'zustand' : 'zustand warnend'}>
            <span className="punkt" />
            <span>{gespeichert ? 'gespeichert' : 'speichert…'}</span>
          </div>
        </div>
      </div>

      <nav className="reiter" aria-label="Bereiche">
        <div className="rahmen">
          {ANSICHTEN.map((eintrag) => (
            <button
              key={eintrag.id}
              type="button"
              aria-current={
                ui.ansicht === eintrag.id || (eintrag.id === 'projekte' && istSprintteil)
              }
              onClick={() => setUi({ ansicht: eintrag.id })}
            >
              <span className="nr">{eintrag.nr}</span>
              {eintrag.titel}
            </button>
          ))}
        </div>
        {imProjekt ? (
          <div className="rahmen unterreiter">
            <span className="nr">im Sprint</span>
            {SPRINTTEILE.map((eintrag) => (
              <button
                key={eintrag.id}
                type="button"
                aria-current={ui.ansicht === eintrag.id}
                onClick={() => setUi({ ansicht: eintrag.id })}
              >
                {eintrag.titel}
              </button>
            ))}
          </div>
        ) : null}
        {ui.ansicht === 'stammdaten' ? (
          <div className="rahmen unterreiter">
            <span className="nr">Stammdaten</span>
            {STAMMSEITEN.map((eintrag) => (
              <button
                key={eintrag.id}
                type="button"
                aria-current={ui.stammseite === eintrag.id}
                onClick={() => setUi({ stammseite: eintrag.id })}
              >
                {eintrag.titel}
              </button>
            ))}
          </div>
        ) : null}
      </nav>

      <main>
        <div className="rahmen">
          {hinweis && abgewiesen !== hinweis.stufe ? (
            <div
              className={hinweis.stufe === 'dringend' ? 'meldung dringend' : 'meldung'}
              role="status"
            >
              {hinweis.text}{' '}
              <button type="button" className="schalter schlicht" onClick={sicherungSpeichern}>
                jetzt sichern
              </button>{' '}
              <button
                type="button"
                className="schalter schlicht"
                onClick={() => setAbgewiesen(hinweis.stufe)}
              >
                später
              </button>
            </div>
          ) : null}

          {meldung ? (
            <div className="meldung" role="status">
              {meldung}{' '}
              <button type="button" className="schalter schlicht" onClick={() => setMeldung(null)}>
                schließen
              </button>
            </div>
          ) : null}

          {ui.ansicht === 'projekte' ? <ProjektAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'klassen' ? (
            <KlassenAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'schueler' ? (
            <SchuelerAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'projekte' ? (
            <ProjektStammdatenAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'tests' ? (
            <TestStammdatenAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'rubrik' ? (
            <RubrikAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'stammdaten' && ui.stammseite === 'stichtage' ? (
            <StichtagAnsicht {...gemeinsam} />
          ) : null}
          {ui.ansicht === 'planning' ? <SprintplanningAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'daily' ? <DailyAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'review' ? <SprintreviewAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'diplomarbeit' ? <DiplomarbeitAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'tests' ? <TestAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'auswertung' ? <AuswertungAnsicht {...gemeinsam} /> : null}
        </div>
      </main>

      <footer className="fusszeile">
        <div className="rahmen zeile">
          <span>
            Alle Daten bleiben in diesem Browser – {standText(sicherung)}.{' '}
            {automatikText(sicherung)} Die Sicherung gehört in den schulischen Speicher (DS-06).
          </span>
          <span className="dehnen" />
          {/* FA-64 AK-7: Ohne die Schnittstelle wird die Funktion nicht angeboten. */}
          {!ordnerwahlMoeglich() ? (
            <span className="anmerkung">
              Dieser Browser kann nicht selbst in einen Ordner schreiben – bitte von Hand sichern
              (Chrome oder Edge können es).
            </span>
          ) : sicherung.automatisch === 'aus' ? (
            <button
              type="button"
              className="schalter klein"
              onClick={() => void ordnerEinrichten()}
            >
              Ordner für die Sicherung wählen
            </button>
          ) : (
            <>
              {sicherung.automatisch !== 'ok' ? (
                <button
                  type="button"
                  className="schalter klein haupt"
                  onClick={() => void ordnerFreigeben()}
                >
                  Ordner freigeben
                </button>
              ) : null}
              <BestaetigenSchalter
                beschriftung="Automatik beenden"
                klasse="schalter klein"
                onBestaetigt={() => void ordnerLoesen()}
              />
            </>
          )}
          <button type="button" className="schalter klein" onClick={sicherungSpeichern}>
            Sicherung speichern
          </button>
          <button
            type="button"
            className="schalter klein"
            onClick={() => dateiwahl.current?.click()}
          >
            Sicherung einlesen
          </button>
          <input
            ref={dateiwahl}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const datei = e.target.files?.[0];
              if (datei) void sicherungEinlesen(datei);
              e.target.value = '';
            }}
          />
          <BestaetigenSchalter
            beschriftung="Alle Daten löschen"
            frage="wirklich alles löschen?"
            klasse="schalter klein"
            onBestaetigt={() => {
              loeschen();
              standLoeschen();
              setSicherung(standLesen());
              dispatch({ art: 'daten/ersetzen', daten: leererDatenbestand() });
              setMeldung('Alle Daten wurden gelöscht.');
            }}
          />
        </div>
      </footer>
    </>
  );
}
