import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AccountInfoScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth().currentUser;
      if (user) {
        setEmail(user.email);
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setFullName(userData.fullName);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    const user = auth().currentUser;
    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({
          fullName: fullName,
        });
        Alert.alert('Succes', 'Modificările au fost salvate.');
      } catch (error) {
        console.error('Error saving user data:', error);
        Alert.alert('Eroare', 'A apărut o eroare la salvarea modificărilor.');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirmare',
      'Ești sigur că vrei să ștergi acest cont?',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Șterge',
          onPress: async () => {
            setIsLoading(true);
            const user = auth().currentUser;
            if (user) {
              try {
                const userDoc = await firestore().collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                const trainerId = userData.trainer;

                const batch = firestore().batch();

                
                const appointmentsQuery = await firestore().collection('appointments').where('trainerId', '==', trainerId).get();
                appointmentsQuery.forEach(doc => {
                  batch.delete(doc.ref);
                });
 
                const scheduleQuery = await firestore().collection('schedules').doc(trainerId).get();
                if (scheduleQuery.exists) {
                  batch.delete(scheduleQuery.ref);
                }
                
                if (trainerId) {
                  const trainerDoc = firestore().collection('trainers').doc(trainerId);
                  batch.delete(trainerDoc);
                }

                batch.delete(firestore().collection('users').doc(user.uid));

                await batch.commit();

                await user.delete();
                Alert.alert('Succes', 'Contul și datele asociate au fost șterse.');
                await auth().signOut();
              } catch (error) {
                console.log(error);
              }
            }
            setIsLoading(false);
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.titlu}>Informații cont</Text>
        <Text style={styles.label}>Adresa de email</Text>
        <TextInput
          value={email}
          editable={false}
          style={styles.input}
        />
        <Text style={styles.label}>Nume utilizator</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSaveChanges} style={styles.button}>
          <Text style={styles.buttonText}>Salvează modificări</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleDeleteAccount} style={[styles.button, styles.deleteButton]}>
        <Text style={styles.buttonText}>Șterge cont</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
    justifyContent: 'space-between',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  titlu:{
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    textAlign:'center',

  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default AccountInfoScreen;
