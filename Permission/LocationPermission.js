import axios from 'axios';

export const getCityFromCoordinates = async (latitude, longitude, apiKey) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
    const results = response.data.results;

    if (results.length > 0) {
      const addressComponents = results[0].address_components;
      const cityComponent = addressComponents.find(component => component.types.includes("locality"));

      if (cityComponent) {
        return cityComponent.long_name;
      } else {
        throw new Error('Orașul nu a fost găsit în răspunsul API-ului.');
      }
    } else {
      throw new Error('Nu s-au găsit rezultate pentru coordonatele furnizate.');
    }
  } catch (error) {
    throw new Error(`Eroare la obținerea orașului: ${error.message}`);
  }
};
