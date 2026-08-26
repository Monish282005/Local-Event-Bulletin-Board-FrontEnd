import axios from 'axios';
import { Country, State, City } from 'country-state-city';

const CSC_BASE_URL = 'https://api.countrystatecity.in/v1';

const cache = {
  countries: null,
  states: {},
  cities: {},
};

function getApiKey() {
  const key = import.meta.env.VITE_CSC_API_KEY;
  if (key && key !== 'your_api_key_here' && key.trim() !== '') {
    return key.trim();
  }
  return '1550fa6d47c329f847772aefa0b44ad832d5bc6837c4833fc9621726b83d5d32';
}

const allLocalCountries = Country.getAllCountries();

function findCountryObj(countryName) {
  if (!countryName) return null;
  const nameTrim = countryName.trim().toLowerCase();
  return allLocalCountries.find((c) => c.name.toLowerCase() === nameTrim);
}

// 1. Fetch Countries via REST API
export async function fetchCountriesFromApi() {
  if (cache.countries) return cache.countries;

  const apiKey = getApiKey();
  try {
    // console.log('[locationData] Dispatching GET https://api.countrystatecity.in/v1/countries');
    const response = await axios.get(`${CSC_BASE_URL}/countries`, {
      headers: { 'X-CSCAPI-KEY': apiKey },
    });
    if (Array.isArray(response.data) && response.data.length > 0) {
      cache.countries = response.data.map((c) => c.name).sort();
      return cache.countries;
    }
  } catch (err) {
    console.warn('[locationData] REST API countries call failed, using fallback:', err.message);
  }

  return allLocalCountries.map((c) => c.name).sort();
}

export function getCountries() {
  return allLocalCountries.map((c) => c.name).sort();
}

// 2. Fetch States via REST API
export async function fetchStatesFromApi(countryName) {
  if (!countryName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [];

  const cacheKey = cObj.isoCode;
  if (cache.states[cacheKey]) return cache.states[cacheKey];

  const apiKey = getApiKey();
  try {
    // console.log(`[locationData] Dispatching GET https://api.countrystatecity.in/v1/countries/${cObj.isoCode}/states`);
    const response = await axios.get(`${CSC_BASE_URL}/countries/${cObj.isoCode}/states`, {
      headers: { 'X-CSCAPI-KEY': apiKey },
    });
    if (Array.isArray(response.data) && response.data.length > 0) {
      cache.states[cacheKey] = response.data.map((s) => s.name).sort();
      return cache.states[cacheKey];
    }
  } catch (err) {
    console.warn(`[locationData] REST API states call failed for ${countryName}:`, err.message);
  }

  const states = State.getStatesOfCountry(cObj.isoCode);
  if (states.length === 0) return [countryName];
  return states.map((s) => s.name).sort();
}

export function getStates(countryName) {
  if (!countryName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [];
  const states = State.getStatesOfCountry(cObj.isoCode);
  if (states.length === 0) return [countryName];
  return states.map((s) => s.name).sort();
}

// 3. Fetch Cities / Districts via REST API
export async function fetchCitiesFromApi(countryName, stateName) {
  if (!countryName || !stateName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [];

  const states = State.getStatesOfCountry(cObj.isoCode);
  const sObj = states.find((s) => s.name.toLowerCase() === stateName.trim().toLowerCase());
  if (!sObj) return [stateName];

  const cacheKey = `${cObj.isoCode}_${sObj.isoCode}`;
  if (cache.cities[cacheKey]) return cache.cities[cacheKey];

  const apiKey = getApiKey();
  try {
    // console.log(`[locationData] Dispatching GET https://api.countrystatecity.in/v1/countries/${cObj.isoCode}/states/${sObj.isoCode}/cities`);
    const response = await axios.get(
      `${CSC_BASE_URL}/countries/${cObj.isoCode}/states/${sObj.isoCode}/cities`,
      { headers: { 'X-CSCAPI-KEY': apiKey } }
    );
    if (Array.isArray(response.data) && response.data.length > 0) {
      cache.cities[cacheKey] = Array.from(new Set(response.data.map((c) => c.name))).sort();
      return cache.cities[cacheKey];
    }
  } catch (err) {
    console.warn(`[locationData] REST API cities call failed for ${stateName}:`, err.message);
  }

  const cities = City.getCitiesOfState(cObj.isoCode, sObj.isoCode);
  if (cities.length === 0) return [stateName];
  return Array.from(new Set(cities.map((c) => c.name))).sort();
}

export function getDistricts(countryName, stateName) {
  if (!countryName || !stateName) return [];
  const cObj = findCountryObj(countryName);
  if (!cObj) return [stateName];

  const states = State.getStatesOfCountry(cObj.isoCode);
  const sObj = states.find((s) => s.name.toLowerCase() === stateName.trim().toLowerCase());
  if (!sObj) return [stateName];

  const cities = City.getCitiesOfState(cObj.isoCode, sObj.isoCode);
  if (cities.length === 0) return [stateName];
  return Array.from(new Set(cities.map((c) => c.name))).sort();
}
