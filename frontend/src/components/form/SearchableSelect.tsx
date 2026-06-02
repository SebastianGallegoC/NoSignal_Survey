import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type Ref,
  type TouchEvent,
} from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { FormFieldKey, FormValues } from '@/types/formFields';

export type SelectOption = { value: string; label: string };

const inputClass =
  'mt-1 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm [overflow-wrap:anywhere] form-control-focus';

const inputWithChevronClass = `${inputClass} pr-9 appearance-none`;

const inputErrorClass = 'border-red-600 ring-1 ring-red-500/40';

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function labelForValue(value: string, options: SelectOption[]): string {
  const o = options.find((x) => x.value === value);
  return o ? o.label : '';
}

function resolveOption(query: string, options: SelectOption[]): SelectOption | null {
  const t = query.trim();
  if (t === '') {
    return options.find((o) => o.value === '') ?? null;
  }
  const byValue = options.find((o) => o.value === t);
  if (byValue) {
    return byValue;
  }
  const n = normalize(t);
  return options.find((o) => normalize(o.label) === n) ?? null;
}

function filterOptions(options: SelectOption[], text: string): SelectOption[] {
  const q = text.trim().toLowerCase();
  if (!q) {
    return options;
  }
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      String(o.value).toLowerCase().includes(q) ||
      normalize(o.label).includes(normalize(text)),
  );
}

type SelectBinding = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  inputRef: Ref<HTMLInputElement>;
};

type InnerProps = {
  binding: SelectBinding;
  options: SelectOption[];
  label: string;
  listId: string;
  error?: string;
  /** Borde rojo (validación) */
  invalid?: boolean;
};

const LISTBOX_MAX_HEIGHT_PX = 208;
/** Desplazamiento máximo (px) para considerar tap vs scroll en la lista. */
const LIST_TAP_MOVE_THRESHOLD_PX = 10;

type ListPointerState = {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  scrolled: boolean;
  option: SelectOption;
  target: HTMLLIElement;
};

const SearchableSelectInner = ({
  binding,
  options,
  label,
  listId,
  error,
  invalid,
}: InnerProps) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLInputElement | null>(null);
  /** Trampa de foco breve: evita que el blur salte al siguiente campo del formulario. */
  const focusTrapRef = useRef<HTMLDivElement>(null);
  /** Evita que onBlur revierta la opción recién elegida (típico en táctil). */
  const skipBlurCommitRef = useRef(false);
  const clearSkipTimerRef = useRef<number | null>(null);
  const listPointerRef = useRef<ListPointerState | null>(null);
  const fieldValue = String(binding.value ?? '');
  const [text, setText] = useState(() => labelForValue(fieldValue, options));

  const assignInputRef = (el: HTMLInputElement | null) => {
    inputElRef.current = el;
    const { inputRef } = binding;
    if (typeof inputRef === "function") {
      inputRef(el);
    }
  };

  /** Cierra teclado táctil sin pasar al siguiente campo del formulario. */
  const dismissKeyboardAfterSelection = () => {
    if (clearSkipTimerRef.current !== null) {
      window.clearTimeout(clearSkipTimerRef.current);
    }
    skipBlurCommitRef.current = true;
    const input = inputElRef.current;
    if (input) {
      input.readOnly = true;
      input.blur();
    }
    // Mantener foco aquí: si se hace blur, el navegador suele ir al siguiente
    // campo del formulario.
    focusTrapRef.current?.focus({ preventScroll: true });
    clearSkipTimerRef.current = window.setTimeout(() => {
      if (inputElRef.current) {
        inputElRef.current.readOnly = false;
      }
      skipBlurCommitRef.current = false;
      clearSkipTimerRef.current = null;
    }, 50);
  };

  const applyOption = (option: SelectOption) => {
    skipBlurCommitRef.current = true;
    const nextLabel = labelForValue(option.value, options);
    binding.onChange(option.value);
    setText(nextLabel);
    setOpen(false);
  };

  const pickOptionFromList = (
    option: SelectOption,
    e: MouseEvent | TouchEvent | PointerEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    applyOption(option);
    dismissKeyboardAfterSelection();
  };

  const releaseListPointerSkip = () => {
    if (clearSkipTimerRef.current !== null) {
      window.clearTimeout(clearSkipTimerRef.current);
    }
    clearSkipTimerRef.current = window.setTimeout(() => {
      skipBlurCommitRef.current = false;
      clearSkipTimerRef.current = null;
    }, 50);
  };

  const beginListPointer = (option: SelectOption, e: PointerEvent<HTMLLIElement>) => {
    skipBlurCommitRef.current = true;
    listPointerRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      scrolled: false,
      option,
      target: e.currentTarget,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* algunos entornos (p. ej. jsdom) no implementan pointer capture */
    }
  };

  const moveListPointer = (e: PointerEvent<HTMLLIElement>) => {
    const st = listPointerRef.current;
    if (!st || st.pointerId !== e.pointerId) {
      return;
    }
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (dx * dx + dy * dy > LIST_TAP_MOVE_THRESHOLD_PX * LIST_TAP_MOVE_THRESHOLD_PX) {
      st.moved = true;
    }
  };

  const endListPointer = (e: PointerEvent<HTMLLIElement>) => {
    const st = listPointerRef.current;
    if (!st || st.pointerId !== e.pointerId) {
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignorar si ya se liberó */
    }
    const isTap =
      e.currentTarget === st.target && !st.moved && !st.scrolled;
    if (isTap) {
      pickOptionFromList(st.option, e);
    } else {
      releaseListPointerSkip();
    }
    listPointerRef.current = null;
  };

  const cancelListPointer = (e: PointerEvent<HTMLLIElement>) => {
    const st = listPointerRef.current;
    if (!st || st.pointerId !== e.pointerId) {
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignorar */
    }
    releaseListPointerSkip();
    listPointerRef.current = null;
  };

  const markListScrolled = () => {
    const st = listPointerRef.current;
    if (st) {
      st.scrolled = true;
    }
  };

  useEffect(
    () => () => {
      if (clearSkipTimerRef.current !== null) {
        window.clearTimeout(clearSkipTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    setText(labelForValue(fieldValue, options));
  }, [fieldValue, options]);

  const filtered = useMemo(() => filterOptions(options, text), [options, text]);

  const updateDropDirection = () => {
    const el = anchorRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setDropUp(
      spaceBelow < LISTBOX_MAX_HEIGHT_PX + 12 &&
      spaceAbove > spaceBelow,
    );
  };

  const commitOrRevert = () => {
    const resolved = resolveOption(text, options);
    if (resolved) {
      binding.onChange(resolved.value);
      setText(labelForValue(resolved.value, options));
    } else {
      setText(labelForValue(fieldValue, options));
    }
  };

  const inputRing = invalid || error ? inputErrorClass : '';

  return (
    <label className="flex min-w-0 max-w-full flex-col text-sm font-medium text-slate-800 md:col-span-2">
      {label}
      <div
        ref={anchorRef}
        className={`relative mt-1 ${open ? "z-[5000]" : "z-0"}`}
      >
        <input
          ref={assignInputRef}
          name={binding.name}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className={`${inputWithChevronClass} ${inputRing}`.trim()}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            updateDropDirection();
          }}
          onFocus={() => {
            if (inputElRef.current) {
              inputElRef.current.readOnly = false;
            }
            updateDropDirection();
            setOpen(true);
          }}
          onBlur={() => {
            binding.onBlur();
            if (skipBlurCommitRef.current) {
              return;
            }
            setOpen(false);
            commitOrRevert();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              setText(labelForValue(fieldValue, options));
              dismissKeyboardAfterSelection();
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              if (open && filtered.length === 1) {
                applyOption(filtered[0]);
                dismissKeyboardAfterSelection();
              } else if (open) {
                setOpen(false);
                dismissKeyboardAfterSelection();
              } else {
                dismissKeyboardAfterSelection();
              }
            }
          }}
        />
        <div
          tabIndex={-1}
          ref={focusTrapRef}
          className="sr-only absolute h-0 w-0 overflow-hidden border-0 p-0 opacity-0"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        {open && filtered.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className={`absolute z-[5001] max-h-52 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg touch-pan-y ${
              dropUp ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            onScroll={markListScrolled}
          >
            {filtered.map((o) => (
              <li
                key={o.value === '' ? '__empty__' : o.value}
                role="option"
                aria-selected={binding.value === o.value}
                className="cursor-pointer px-3 py-2 text-sm text-slate-800 hover:bg-teal-50"
                onPointerDown={(e) => beginListPointer(o, e)}
                onPointerMove={moveListPointer}
                onPointerUp={endListPointer}
                onPointerCancel={cancelListPointer}
              >
                {o.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </label>
  );
};

type SearchableSelectProps = {
  name: FormFieldKey;
  control: Control<FormValues>;
  options: SelectOption[];
  error?: string;
  label: string;
};

export const SearchableSelect = ({ name, control, options, error, label }: SearchableSelectProps) => {
  const listId = useId();

  const allowedValues = useMemo(() => new Set(options.map((o) => o.value)), [options]);

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (v: string) => {
          const t = String(v ?? "").trim();
          if (t === "") {
            return true;
          }
          return allowedValues.has(v) ? true : "Elegí una opción de la lista";
        },
      }}
      render={({ field }) => (
        <SearchableSelectInner
          binding={{
            value: String(field.value ?? ''),
            onChange: field.onChange,
            onBlur: field.onBlur,
            name: field.name,
            inputRef: field.ref,
          }}
          options={options}
          label={label}
          listId={listId}
          error={error}
        />
      )}
    />
  );
};

export type SearchableSelectControlledProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  error?: string;
  /** id estable para accesibilidad (opcional) */
  id?: string;
};

/** Mismo combobox que el formulario, sin react-hook-form (p. ej. importación Excel). */
export const SearchableSelectControlled = ({
  value,
  onChange,
  options,
  label,
  error,
  id: idProp,
}: SearchableSelectControlledProps) => {
  const genId = useId();
  const listId = idProp ? `${idProp}-list` : genId;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SearchableSelectInner
      binding={{
        value: String(value ?? ''),
        onChange,
        onBlur: () => {},
        name: idProp ?? 'import-select',
        inputRef,
      }}
      options={options}
      label={label}
      listId={listId}
      error={error}
      invalid={Boolean(error)}
    />
  );
};
