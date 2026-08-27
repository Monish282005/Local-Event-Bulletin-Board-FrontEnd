import { Country, State, City } from 'country-state-city';

const cache = {
  countries: null,
  states: {},
  cities: {},
};

const allLocalCountries = Country.getAllCountries();

function findCountryObj(countryName) {
  if (!countryName) return null;
  const nameTrim = countryName.trim().toLowerCase();
  return allLocalCountries.find((c) => c.name.toLowerCase() === nameTrim);
}

// 1. Fetch / Get Countries (Instant Local Offline Data - No External API 429 Rate Limits)
export async function fetchCountriesFromApi() {
  if (cache.countries) return cache.countries;
  cache.countries = allLocalCountries.map((c) => c.name).sort();
  return cache.countries;
}

export function getCountries() {
  if (cache.countries) return cache.countries;
  cache.countries = allLocalCountries.map((c) => c.name).sort();
  return cache.countries;
}

// 2. Fetch / Get States (Instant Local Offline Data)
export async function fetchStatesFromApi(countryName) {
  return getStates(countryName);
}

export function getStates(countryName) {
  if (!countryName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [];

  const cacheKey = cObj.isoCode;
  if (cache.states[cacheKey]) return cache.states[cacheKey];

  const states = State.getStatesOfCountry(cObj.isoCode);
  if (states.length === 0) {
    cache.states[cacheKey] = [countryName];
  } else {
    cache.states[cacheKey] = states.map((s) => s.name).sort();
  }
  return cache.states[cacheKey];
}

// 3. Fetch / Get Cities & Districts (Instant Local Offline Data)
export async function fetchCitiesFromApi(countryName, stateName) {
  return getDistricts(countryName, stateName);
}

export function getDistricts(countryName, stateName) {
  if (!countryName || !stateName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [];

  const states = State.getStatesOfCountry(cObj.isoCode);
  const sObj = states.find((s) => s.name.toLowerCase() === stateName.trim().toLowerCase());
  if (!sObj) return [stateName];

  const cacheKey = `${cObj.isoCode}_${sObj.isoCode}`;
  if (cache.cities[cacheKey]) return cache.cities[cacheKey];

  const cities = City.getCitiesOfState(cObj.isoCode, sObj.isoCode);
  if (cities.length === 0) {
    cache.cities[cacheKey] = [stateName];
  } else {
    cache.cities[cacheKey] = Array.from(new Set(cities.map((c) => c.name))).sort();
  }
  return cache.cities[cacheKey];
}
