import { describe, expect, it } from 'vitest';

import { fieldSelectOptions } from '@/config/formSelectOptions';
import {
  CENS_INFLUENCE_MUNICIPIOS,
  isMunicipioInCensInfluence,
} from '@/config/censInfluenceArea';

describe('censInfluenceArea', () => {
  it('incluye 47 municipios del AOI CENS', () => {
    expect(CENS_INFLUENCE_MUNICIPIOS).toHaveLength(47);
  });

  it('todos los municipios CENS existen en formSelectOptions', () => {
    const options = new Set(
      (fieldSelectOptions.municipio ?? []).map((o) => o.value),
    );
    for (const municipio of CENS_INFLUENCE_MUNICIPIOS) {
      expect(options.has(municipio), municipio).toBe(true);
    }
  });

  it('isMunicipioInCensInfluence reconoce municipios del AOI', () => {
    expect(isMunicipioInCensInfluence('Cúcuta')).toBe(true);
    expect(isMunicipioInCensInfluence('Morales (Bolívar)')).toBe(true);
    expect(isMunicipioInCensInfluence('Medellín')).toBe(false);
  });
});
