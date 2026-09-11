/**
 * Wiederverwendete Anzeige- und Eingabebausteine.
 *
 * Diese Komponenten rechnen nicht – sie stellen dar, was ihnen übergeben wird.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { formatProzent, note as noteZu } from '../domain/scoring';
import type { Notenstufe } from '../domain/types';

export function Prozent({ wert, stellen = 0 }: { wert: number | null; stellen?: number }) {
  return <span className="prozent">{wert === null ? '–' : `${formatProzent(wert, stellen)} %`}</span>;
}

export function Notenzeichen({
  prozent,
  notenschluessel,
}: {
  prozent: number | null;
  notenschluessel: Notenstufe[];
}) {
  const note = noteZu(prozent, notenschluessel);
  const beschriftung =
    note === null
      ? 'Noch keine Note – zu wenig erfasst'
      : `Note ${note}: ${notenschluessel.find((n) => n.note === note)?.bezeichnung ?? ''}`;
  return (
    <span className={note === null ? 'note note-leer' : `note note-${note}`} title={beschriftung}>
      {note ?? '–'}
    </span>
  );
}

export function Balken({ wert }: { wert: number | null }) {
  const breite = wert === null ? 0 : Math.max(0, Math.min(100, wert));
  return (
    <div className="balken" aria-hidden="true">
      <i style={{ width: `${breite}%` }} />
    </div>
  );
}

export function Karte({
  titel,
  hinweis,
  rechts,
  buendig,
  children,
}: {
  titel: string;
  hinweis?: ReactNode;
  rechts?: ReactNode;
  buendig?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="karte">
      <header>
        <h3>{titel}</h3>
        {hinweis ? <span className="hinweis">{hinweis}</span> : null}
        {rechts ? (
          <>
            <span className="dehnen" />
            {rechts}
          </>
        ) : null}
      </header>
      <div className={buendig ? 'inhalt bündig' : 'inhalt'}>{children}</div>
    </section>
  );
}

/**
 * Punkteeingabe.
 *
 * Der angezeigte Text wird lokal gehalten, damit Zwischenzustände beim Tippen
 * (etwa „7,“ ) nicht sofort auf eine Zahl gerundet werden. Ein leeres Feld
 * meldet `null` – „nicht bewertet“ ist nicht dasselbe wie 0 Punkte.
 */
export function Punktefeld({
  wert,
  max,
  beschriftung,
  schmal,
  onAendern,
}: {
  wert: number | undefined;
  max: number;
  beschriftung: string;
  schmal?: boolean;
  onAendern: (wert: number | null) => void;
}) {
  const [text, setText] = useState(wert === undefined ? '' : String(wert));
  const fokussiert = useRef(false);

  useEffect(() => {
    if (!fokussiert.current) setText(wert === undefined ? '' : String(wert));
  }, [wert]);

  return (
    <input
      type="number"
      className={schmal ? 'schmal' : undefined}
      min={0}
      max={max}
      step={0.5}
      value={text}
      aria-label={beschriftung}
      onFocus={() => {
        fokussiert.current = true;
      }}
      onBlur={() => {
        fokussiert.current = false;
        setText(wert === undefined ? '' : String(wert));
      }}
      onChange={(ereignis) => {
        const roh = ereignis.target.value;
        setText(roh);
        if (roh.trim() === '') {
          onAendern(null);
          return;
        }
        const zahl = Number(roh.replace(',', '.'));
        if (Number.isFinite(zahl)) onAendern(zahl);
      }}
    />
  );
}

/** Textfeld, das erst beim Verlassen bzw. entprellt meldet. */
export function Textfeld({
  wert,
  beschriftung,
  platzhalter,
  mehrzeilig,
  breit,
  onAendern,
}: {
  wert: string;
  beschriftung: string;
  platzhalter?: string;
  mehrzeilig?: boolean;
  breit?: boolean;
  onAendern: (wert: string) => void;
}) {
  const [text, setText] = useState(wert);
  const fokussiert = useRef(false);

  useEffect(() => {
    if (!fokussiert.current) setText(wert);
  }, [wert]);

  const gemeinsam = {
    value: text,
    'aria-label': beschriftung,
    placeholder: platzhalter,
    onFocus: () => {
      fokussiert.current = true;
    },
    onBlur: () => {
      fokussiert.current = false;
    },
    onChange: (ereignis: { target: { value: string } }) => {
      setText(ereignis.target.value);
      onAendern(ereignis.target.value);
    },
  };

  return mehrzeilig ? (
    <textarea {...gemeinsam} />
  ) : (
    <input type="text" style={breit ? { width: '100%' } : undefined} {...gemeinsam} />
  );
}

/**
 * Schalter, der eine zweite Bestätigung verlangt (FA-36).
 *
 * Bewusst kein `window.confirm`: Das blockiert den Browser und ist in
 * automatisierten Tests unzuverlässig.
 */
export function BestaetigenSchalter({
  beschriftung,
  frage = 'wirklich?',
  klasse = 'schalter schlicht klein',
  onBestaetigt,
}: {
  beschriftung: string;
  frage?: string;
  klasse?: string;
  onBestaetigt: () => void;
}) {
  const [scharf, setScharf] = useState(false);

  useEffect(() => {
    if (!scharf) return;
    const zeitgeber = setTimeout(() => setScharf(false), 5000);
    return () => clearTimeout(zeitgeber);
  }, [scharf]);

  return (
    <button
      type="button"
      className={scharf ? 'schalter gefahr klein' : klasse}
      onClick={() => {
        if (scharf) {
          setScharf(false);
          onBestaetigt();
        } else {
          setScharf(true);
        }
      }}
    >
      {scharf ? frage : beschriftung}
    </button>
  );
}

export function LeerHinweis({ titel, text, aktion }: { titel: string; text: ReactNode; aktion?: ReactNode }) {
  return (
    <div className="karte">
      <div className="leer">
        <h3 style={{ marginBottom: 6 }}>{titel}</h3>
        <p className="anmerkung">{text}</p>
        {aktion ? <p style={{ marginTop: 14 }}>{aktion}</p> : null}
      </div>
    </div>
  );
}
