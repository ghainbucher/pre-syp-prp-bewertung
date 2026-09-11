/**
 * Rahmen der Anwendung: Datenbestand laden und speichern, Ansicht wählen,
 * Sicherung erzeugen und einlesen.
 */

import { useEffect, useReducer, useRef, useState } from 'react';

import { leererDatenbestand } from './domain/defaults';
import { AuswertungAnsicht } from './ansichten/AuswertungAnsicht';
import { BewertenAnsicht } from './ansichten/BewertenAnsicht';
import { RubrikAnsicht } from './ansichten/RubrikAnsicht';
import { StrukturAnsicht } from './ansichten/StrukturAnsicht';
import { dateiAnbieten } from './export/csv';
import {
  alsSicherung,
  ausSicherung,
  laden,
  loeschen,
  sicherungsDateiname,
  speichern,
} from './store/persistence';
import { storeReducer } from './store/storeReducer';
import { auswahlKorrigieren, klassen as alleKlassen } from './ui/auswahl';
import { BestaetigenSchalter } from './ui/bausteine';
import { useUiZustand, type Ansicht } from './ui/useUiZustand';

const ANSICHTEN: Array<{ id: Ansicht; nr: string; titel: string }> = [
  { id: 'bewerten', nr: '01', titel: 'Bewerten' },
  { id: 'auswertung', nr: '02', titel: 'Auswertung' },
  { id: 'struktur', nr: '03', titel: 'Klassen & Teams' },
  { id: 'rubrik', nr: '04', titel: 'Rubrik & Notenschlüssel' },
];

const start = laden();

export function App() {
  const [daten, dispatch] = useReducer(storeReducer, start.daten);
  const [ui, setUi] = useUiZustand();
  const [meldung, setMeldung] = useState<string | null>(start.warnung);
  const [gespeichert, setGespeichert] = useState(true);
  const dateiwahl = useRef<HTMLInputElement>(null);
  // Für das Sichern beim Verlassen der Seite: der jeweils letzte Stand und ob
  // er noch ungeschrieben ist.
  const datenRef = useRef(daten);
  const offen = useRef(false);

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
      if (!erfolg) {
        setMeldung('Der Datenbestand konnte nicht gespeichert werden. Bitte eine Sicherung anlegen.');
      }
    }, 400);
    return () => clearTimeout(zeitgeber);
  }, [daten]);

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

  // Auswahl gültig halten, wenn Klassen, Teams oder Abschnitte wegfallen.
  useEffect(() => {
    const korrektur = auswahlKorrigieren(daten, ui);
    if (korrektur) setUi(korrektur);
  }, [daten, ui, setUi]);

  const klassen = alleKlassen(daten);
  const gemeinsam = { daten, dispatch, ui, setUi };

  function sicherungSpeichern() {
    dateiAnbieten(sicherungsDateiname(), alsSicherung(daten), 'application/json');
    setMeldung(
      'Die Sicherung enthält Namen und Noten im Klartext – bitte wie eine Notenliste behandeln.',
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
          {klassen.length > 0 ? (
            <div className="zeile">
              <label className="etikett" htmlFor="klassenwahl">
                Klasse
              </label>
              <select
                id="klassenwahl"
                value={ui.klasseId ?? ''}
                onChange={(e) => setUi({ klasseId: e.target.value, abschnittId: null, teamId: null })}
              >
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
              aria-current={ui.ansicht === eintrag.id}
              onClick={() => setUi({ ansicht: eintrag.id })}
            >
              <span className="nr">{eintrag.nr}</span>
              {eintrag.titel}
            </button>
          ))}
        </div>
      </nav>

      <main>
        <div className="rahmen">
          {meldung ? (
            <div className="meldung" role="status">
              {meldung}{' '}
              <button type="button" className="schalter schlicht" onClick={() => setMeldung(null)}>
                schließen
              </button>
            </div>
          ) : null}

          {ui.ansicht === 'bewerten' ? <BewertenAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'auswertung' ? <AuswertungAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'struktur' ? <StrukturAnsicht {...gemeinsam} /> : null}
          {ui.ansicht === 'rubrik' ? <RubrikAnsicht {...gemeinsam} /> : null}
        </div>
      </main>

      <footer className="fusszeile">
        <div className="rahmen zeile">
          <span>
            Alle Daten bleiben in diesem Browser. Sicherung regelmäßig speichern – ein gelöschter
            Browserspeicher nimmt sie mit.
          </span>
          <span className="dehnen" />
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
              dispatch({ art: 'daten/ersetzen', daten: leererDatenbestand() });
              setMeldung('Alle Daten wurden gelöscht.');
            }}
          />
        </div>
      </footer>
    </>
  );
}
