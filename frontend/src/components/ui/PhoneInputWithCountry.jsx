import React from 'react'; 
import { cn } from '../../lib/utils/cn'; 
 
const COUNTRIES = [
  { code: 'BO', dial: '+591', label: 'BO +591', flag: '🇧🇴' },
  { code: 'AR', dial: '+54', label: 'AR +54', flag: '🇦🇷' },
  { code: 'BR', dial: '+55', label: 'BR +55', flag: '🇧🇷' },
  { code: 'CL', dial: '+56', label: 'CL +56', flag: '🇨🇱' },
  { code: 'PE', dial: '+51', label: 'PE +51', flag: '🇵🇪' },
  { code: 'CO', dial: '+57', label: 'CO +57', flag: '🇨🇴' },
  { code: 'EC', dial: '+593', label: 'EC +593', flag: '🇪🇨' },
  { code: 'PY', dial: '+595', label: 'PY +595', flag: '🇵🇾' },
  { code: 'UY', dial: '+598', label: 'UY +598', flag: '🇺🇾' },
  { code: 'MX', dial: '+52', label: 'MX +52', flag: '🇲🇽' },
  { code: 'US', dial: '+1', label: 'US +1', flag: '🇺🇸' },
  { code: 'ES', dial: '+34', label: 'ES +34', flag: '🇪🇸' },
];

function cleanLocalNumber(value, dialCode) {
  let clean = String(value || '').replace(/\D/g, '');

  const dialDigits = dialCode.replace(/\D/g, '');

  if (clean.startsWith('00' + dialDigits)) {
    clean = clean.slice(('00' + dialDigits).length);
  }

  if (clean.startsWith(dialDigits)) {
    clean = clean.slice(dialDigits.length);
  }

  return clean;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  error,
  placeholder = 'Número de celular',
  className,
}) {
  const [countryCode, setCountryCode] = React.useState('BO');
  const selected = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const localValue = React.useMemo(() => {
    return cleanLocalNumber(value || '', selected.dial);
  }, [value, selected.dial]);

  const emitValue = (dial, local) => {
    const cleanLocal = cleanLocalNumber(local, dial);
    onChange?.(`${dial}${cleanLocal}`);
  };

  const handleCountryChange = (e) => {
    const nextCode = e.target.value;
    const nextCountry = COUNTRIES.find((c) => c.code === nextCode) || COUNTRIES[0];

    setCountryCode(nextCode);
    emitValue(nextCountry.dial, localValue);
  };

  const handleLocalChange = (e) => {
    const cleanLocal = cleanLocalNumber(e.target.value, selected.dial);
    emitValue(selected.dial, cleanLocal);
  };

  return (
    <div className={cn('w-full', className)}> 
      <div 
        className={cn(
          'flex w-full items-center overflow-hidden rounded-m3 border bg-white/[0.03] transition-all duration-300',
          error 
            ? 'border-sav-error/50 bg-sav-error/5'
            : 'border-white/[0.08] hover:border-white/[0.15] focus-within:border-sav-accent/50 focus-within:ring-4 focus-within:ring-sav-accent/10'
        )}
      >
        <div className="relative h-13 w-[100px] shrink-0">
          <select 
            value={countryCode} 
            onChange={handleCountryChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          > 
            {COUNTRIES.map((country) => ( 
              <option key={country.code} value={country.code} className="bg-zinc-950 text-white"> 
                {country.flag} {country.dial} 
              </option> 
            ))} 
          </select> 
          <div className="flex h-full items-center justify-center gap-2 px-3 border-r border-white/[0.08] bg-white/[0.02]">
            <span className="text-lg">{selected.flag}</span>
            <span className="text-[11px] font-bold text-white">{selected.dial}</span>
          </div>
        </div>
 
        <input 
          type="tel" 
          inputMode="numeric" 
          value={localValue} 
          onChange={handleLocalChange} 
          placeholder={placeholder} 
          className="h-13 min-w-0 flex-1 border-0 bg-transparent px-5 text-[14px] font-medium text-white outline-none placeholder:text-zinc-600" 
        /> 
      </div> 
 
      {error && ( 
        <p className="mt-2 px-1 text-[10px] font-bold uppercase tracking-widest text-sav-error animate-in fade-in slide-in-from-top-1"> 
          {error} 
        </p> 
      )} 
    </div> 
  ); 
} 
 
export default PhoneInputWithCountry;