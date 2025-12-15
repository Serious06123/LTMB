// File: src/services/mapService.js

import { GOONG_CONFIG } from '../constants/config';

const BASE_URL = GOONG_CONFIG.BASE_URL;

const mapService = {
  // Hàm helper để gọi API (tránh lặp code)
  _get: async (path) => {
    try {
      const response = await fetch(path);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Map Service Error:", error);
      return null;
    }
  },

  getFindText: (input) => {
    return mapService._get(`${BASE_URL}place/find?input=${input}`);
  },

  getPlacesAutocomplete: (params) => {
    return mapService._get(`${BASE_URL}place/autocomplete?input=${params.search}`);
  },

  getGeocoding: (params) => {
    return mapService._get(`${BASE_URL}geocode?address=${params.description}`);
  },

  getPlaceDetail: (params) => {
    return mapService._get(`${BASE_URL}place/detail?place_id=${params.place_id}`);
  },
  
  getDirections: (body) => {
    const origin = `${body.origin[1]},${body.origin[0]}`;
    const destination = `${body.destination[1]},${body.destination[0]}`;
    const vehicle = body.vehicle || 'car';

    return mapService._get(
      `${BASE_URL}direction?origin=${origin}&destination=${destination}&vehicle=${vehicle}`
    );
  },
  getReverseGeocoding: (lat, lng) => {
    return mapService._get(`${BASE_URL}geocode/reverse?lat=${lat}&lng=${lng}`);
  },
};

export default mapService;