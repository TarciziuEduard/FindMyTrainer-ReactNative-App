import React, { useContext, useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddTrainerInfoScreen from '../screens/AddTrainerInfoScreen'
import TrainerProfileScreen from '../screens/TrainerProfileScreen'
import TrainerListScreen from '../screens/TrainerListScreen';
import GymListScreen from '../screens/GymListScreen';
import GymProfileScreen from '../screens/GymProfileScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ManageScheduleScreen from '../screens/ManageScheduleScreen';
import ConfirmAppointmentScreen from '../screens/ConfirmAppointmentScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import AccountInfoScreen from '../screens/AccountInfoScreen';

const Stack = createStackNavigator();

const AppStack = () => {

  return (

      
        <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name='Home' component={HomeScreen} />
              <Stack.Screen name='ProfileScreen' component={ProfileScreen} />
              <Stack.Screen name='AddTrainerInfo' component={AddTrainerInfoScreen} />
              <Stack.Screen name='TrainerProfileScreen' component={TrainerProfileScreen} />
              <Stack.Screen name='TrainerListScreen' component={TrainerListScreen} />
              <Stack.Screen name='GymListScreen' component={GymListScreen} />
              <Stack.Screen name='GymProfileScreen' component={GymProfileScreen} />
              <Stack.Screen name='ScheduleScreen' component={ScheduleScreen} />
              <Stack.Screen name='ManageScheduleScreen' component={ManageScheduleScreen} />
              <Stack.Screen name='ConfirmAppointmentScreen' component={ConfirmAppointmentScreen} />
              <Stack.Screen name='AppointmentsScreen' component={AppointmentsScreen} />
              <Stack.Screen name='AccountInfoScreen' component={AccountInfoScreen} />

        </Stack.Navigator>
      
  );
};

export default AppStack;