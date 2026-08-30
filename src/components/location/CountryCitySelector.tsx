'use client';

import React, { useMemo } from 'react';
import { Country, State } from 'country-state-city';
import { Select } from '@/components/ui/Select';

interface CountryCitySelectorProps {
  countryCode: string;
  cityCode: string;
  countryError?: string;
  cityError?: string;
  onCountryChange: (countryCode: string) => void;
  onCityChange: (cityCode: string, coordinates?: { latitude: number; longitude: number }) => void;
}

const peruDepartmentCodes: Record<string, string> = {
  AMA: '01', ANC: '02', APU: '03', ARE: '04', AYA: '05', CAJ: '06', CAL: '07',
  CUS: '08', HUV: '09', HUC: '10', ICA: '11', JUN: '12', LAL: '13', LAM: '14',
  LIM: '15', LOR: '16', MDD: '17', MOQ: '18', PAS: '19', PIU: '20', PUN: '21',
  SAM: '22', TAC: '23', TUM: '24', UCA: '25',
};

const divisionCode = (countryCode: string, stateCode: string): string =>
  countryCode === 'PE' ? peruDepartmentCodes[stateCode] || stateCode : stateCode;

export default function CountryCitySelector({
  countryCode,
  cityCode,
  countryError,
  cityError,
  onCountryChange,
  onCityChange,
}: CountryCitySelectorProps) {
  const countries = useMemo(
    () => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name, 'es')),
    []
  );
  const divisions = useMemo(
    () => countryCode
      ? State.getStatesOfCountry(countryCode).sort((a, b) => a.name.localeCompare(b.name, 'es'))
      : [],
    [countryCode]
  );

  const handleCountryChange = (nextCountryCode: string) => {
    onCountryChange(nextCountryCode);
    onCityChange('');
  };

  const handleCityChange = (nextCityCode: string) => {
    const division = divisions.find((item) => divisionCode(countryCode, item.isoCode) === nextCityCode);
    const latitude = Number(division?.latitude);
    const longitude = Number(division?.longitude);
    onCityChange(
      nextCityCode,
      Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : undefined
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="País"
        options={countries.map((country) => ({
          value: country.isoCode,
          label: `${country.flag} ${country.name} (${country.isoCode})`,
        }))}
        value={countryCode}
        onChange={(event) => handleCountryChange(event.target.value)}
        error={countryError}
      />
      <Select
        label={countryCode === 'PE' ? 'Departamento' : 'Región / estado'}
        options={[
          { value: '', label: countryCode ? 'Selecciona una opción' : 'Selecciona primero un país' },
          ...divisions.map((division) => {
            const code = divisionCode(countryCode, division.isoCode);
            return { value: code, label: `${division.name} (${code})` };
          }),
        ]}
        value={cityCode}
        onChange={(event) => handleCityChange(event.target.value)}
        disabled={!countryCode || divisions.length === 0}
        error={cityError}
      />
    </div>
  );
}
