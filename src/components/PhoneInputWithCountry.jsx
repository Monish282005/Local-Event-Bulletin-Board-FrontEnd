import React, { useState, useEffect, useRef } from 'react';
import { Country } from 'country-state-city';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function PhoneInputWithCountry({
  value = '',
  onChange,
  selectedCountryName = 'India',
  placeholder = 'Enter mobile phone number',
  inputClassName = '',
}) {
  const allCountries = React.useMemo(() => {
    return Country.getAllCountries().map((c) => {
      const pCode = c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`;
      return {
        name: c.name,
        isoCode: c.isoCode,
        dialCode: pCode,
        flag: c.flag || getFlagEmoji(c.isoCode),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Helper to convert ISO code to flag emoji fallback
  function getFlagEmoji(countryCode) {
    if (!countryCode) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  // Find country matching selectedCountryName or default to India
  const initialCountry = React.useMemo(() => {
    if (selectedCountryName) {
      const match = allCountries.find(
        (c) => c.name.toLowerCase() === selectedCountryName.trim().toLowerCase()
      );
      if (match) return match;
    }
    return allCountries.find((c) => c.isoCode === 'IN') || allCountries[0];
  }, [selectedCountryName, allCountries]);

  const [activeCountry, setActiveCountry] = useState(initialCountry);
  const [localNumber, setLocalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Sync activeCountry when selectedCountryName prop changes
  useEffect(() => {
    if (selectedCountryName) {
      const match = allCountries.find(
        (c) => c.name.toLowerCase() === selectedCountryName.trim().toLowerCase()
      );
      if (match && match.isoCode !== activeCountry.isoCode) {
        setActiveCountry(match);
      }
    }
  }, [selectedCountryName, allCountries]);

  // Parse incoming value into local number and country
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }

    let val = String(value).trim();
    // If value already starts with +, extract dial code & local digits
    if (val.startsWith('+')) {
      const matched = allCountries.find((c) => val.startsWith(c.dialCode));
      if (matched) {
        setActiveCountry(matched);
        const digitsOnly = val.slice(matched.dialCode.length).replace(/[^0-9]/g, '');
        setLocalNumber(digitsOnly);
        return;
      }
    }

    // Otherwise treat whole value as digits
    const digitsOnly = val.replace(/[^0-9]/g, '');
    setLocalNumber(digitsOnly);
  }, [value, allCountries]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocalNumberChange = (e) => {
    let raw = e.target.value;
    // Strip non-digit characters
    let cleanDigits = raw.replace(/[^0-9]/g, '');

    // If user pasted or typed full country code matching active dial code, strip prefix
    const activePureCode = activeCountry.dialCode.replace('+', '');
    if (cleanDigits.startsWith(activePureCode) && cleanDigits.length > activePureCode.length + 5) {
      cleanDigits = cleanDigits.slice(activePureCode.length);
    }

    setLocalNumber(cleanDigits);
    const fullValue = cleanDigits ? `${activeCountry.dialCode} ${cleanDigits}` : '';
    if (onChange) onChange(fullValue, activeCountry);
  };

  const handleSelectCountry = (country) => {
    setActiveCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    const fullValue = localNumber ? `${country.dialCode} ${localNumber}` : '';
    if (onChange) onChange(fullValue, country);
  };

  const filteredCountries = allCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.isoCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full font-sans" ref={dropdownRef}>
      <div className="flex items-center w-full bg-[#FAF9FC] border border-[#E8E7EF] rounded-full focus-within:bg-white focus-within:border-[#0F172A] transition shadow-2xs overflow-hidden">
        {/* Left Badge: Flag + Dial Code */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#F1F5F9] border-r border-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A] font-extrabold text-xs transition cursor-pointer select-none flex-shrink-0"
        >
          <span className="text-base leading-none">{activeCountry.flag}</span>
          <span className="font-bold text-[#0F172A]">{activeCountry.dialCode}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        </button>

        {/* Right Input Box: ONLY local phone number */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleLocalNumberChange}
          placeholder={placeholder}
          className={`w-full bg-transparent px-4 py-2.5 text-sm font-bold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none ${inputClassName}`}
        />
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 max-h-72 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
          {/* Search Header */}
          <div className="p-2.5 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl">
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or dial code..."
                className="w-full text-xs font-bold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 max-h-56">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.isoCode}
                  type="button"
                  onClick={() => handleSelectCountry(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    c.isoCode === activeCountry.isoCode
                      ? 'bg-[#F1F5F9] text-[#0F172A]'
                      : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-extrabold text-[#64748B] font-mono">{c.dialCode}</span>
                    {c.isoCode === activeCountry.isoCode && (
                      <Check className="w-3.5 h-3.5 text-[#0F172A]" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs font-bold text-[#94A3B8]">
                No country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
