import { GOONG_CONFIG } from './constant';

const BASE_URL = GOONG_CONFIG.BASE_URL;

class MapApi {
  _get = async (path) => {
    try {
      const response = await fetch(path);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Backend API Error:", error);
      return null;
    }
  };

  getFindText = (input) => {
    // Gọi về: http://10.0.2.2:4000/api/place/find?input=...
    return this._get(`${BASE_URL}place/find?input=${input}`);
  };

  getPlacesAutocomplete = (params) => {
    return this._get(`${BASE_URL}place/autocomplete?input=${params.search}`);
  };

  getGeocoding = (params) => {
    return this._get(`${BASE_URL}geocode?address=${params.description}`);
  };

  getPlaceDetail = (params) => {
    return this._get(`${BASE_URL}place/detail?place_id=${params.place_id}`);
  };
  
  getDirections = (body) => {
    const origin = `${body.origin[1]},${body.origin[0]}`;
    const destination = `${body.destination[1]},${body.destination[0]}`;
    const vehicle = body.vehicle || 'car';

    return this._get(
      `${BASE_URL}direction?origin=${origin}&destination=${destination}&vehicle=${vehicle}`
    );
  };
}

export default new MapApi();