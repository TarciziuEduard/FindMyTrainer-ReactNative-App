import React from 'react';
import { AuthProvider } from './AuthProvider';
import Routes from './Routes';
import firestore from '@react-native-firebase/firestore'; 


firestore().settings({
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  persistence: true,
});

  
const Providers = () => {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default Providers;