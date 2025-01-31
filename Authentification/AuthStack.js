import React, {useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FirstScreen from '../screens/FirstScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';  
import { fetchGymsAndSaveToFirebase } from '../Permission/CreateGymDatabase';

const Stack = createStackNavigator();

const AuthStack = () => {

  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  let routeName;

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
          const user = auth().currentUser;  
          if (user) {
            await fetchGymsAndSaveToFirebase();  
          }
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error reading AsyncStorage:', error);
      }
    };

    checkFirstLaunch();

    GoogleSignin.configure({
      webClientId: '99314215918-d2j5n18jjf8n0on90t25324f4defltq9.apps.googleusercontent.com',
    });
  }, []);

  if (isFirstLaunch === null) {
    return null;
  } else if (isFirstLaunch == true) {
    routeName = 'Onboarding';
  } else {
    routeName = 'FirstScreen';
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={routeName}>
      <Stack.Screen name='Onboarding' component={OnboardingScreen} />
      <Stack.Screen name='FirstScreen' component={FirstScreen} />
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='Register' component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
