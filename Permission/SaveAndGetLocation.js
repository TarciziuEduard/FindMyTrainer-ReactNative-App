import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveLocationToCache = async (location) => {
  try {
    const locationString = JSON.stringify(location);
    await AsyncStorage.setItem('cachedLocation', locationString);
  } catch (error) {
    console.error('Error saving location to cache:', error);
  }
};

export const getLocationFromCache = async () => {
  try {
    const locationString = await AsyncStorage.getItem('cachedLocation');
    return locationString ? JSON.parse(locationString) : null;
  } catch (error) {
    console.error('Error retrieving location from cache:', error);
    return null;
  }
};