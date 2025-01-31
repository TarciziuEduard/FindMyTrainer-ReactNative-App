import React, { createContext, useState } from "react";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const sendVerificationEmail = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
        console.log("Email de verificare trimis");
      }
    } catch (error) {
      console.error("Eroare la trimiterea emailului de verificare:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login: async (email, password) => {
          try {
            const trimmedEmail = email.trim();
            const userCredentials = await auth().signInWithEmailAndPassword(trimmedEmail, password);
            const { user } = userCredentials;

            if (user && user.emailVerified) {
              setUser(user);
            } else if (user && !user.emailVerified) {
              console.log("Email-ul nu este verificat. Verificați emailul înainte de autentificare.");
              Alert.alert("Email-ul nu este verificat!", "Verificați emailul înainte de autentificare.");
            }
          } catch (e) {
            if (e.code === 'auth/invalid-email') {
              Alert.alert("Eroare de autentificare", "Adresa de email nu este validă.");
            } else if (e.code === 'auth/invalid-credential') {
              Alert.alert("Eroare de autentificare", "Email-ul sau parola sunt incorecte");
            } else {
              Alert.alert("Eroare", e.message);
            }
          }
        },
        googleLogin: async () => {
          try {
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (isSignedIn) {
              await GoogleSignin.revokeAccess();
              await GoogleSignin.signOut();
            }

            const { idToken, user } = await GoogleSignin.signIn();
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            const googleUser = await auth().signInWithCredential(googleCredential);

            if (googleUser) {
              const { user } = googleUser;
              const userDoc = await firestore().collection('users').doc(user.uid).get();

              const profile = googleUser.additionalUserInfo ? googleUser.additionalUserInfo.profile : null;
              const birthDate = profile ? profile.birthday : null;

              if (!userDoc.exists) {
                const userData = {
                  email: user.email,
                  fullName: user.displayName,
                  trainer: false
                };

                if (birthDate) {
                  userData.birth = birthDate;
                }

                await firestore().collection('users').doc(user.uid).set(userData);
              }
              setUser(user);
            }
          } catch (error) {
            console.error({ error });
          }
        },
        register: async (email, password, fullName, confirmPass, birth, navigation) => {
          try {
            const result = await auth().createUserWithEmailAndPassword(email, password);
            if (result.user) {
              setUser(result.user);
              await firestore().collection('users').doc(result.user.uid).set({
                email,
                fullName,
                birth,
                trainer: false
              });
              sendVerificationEmail();
              Alert.alert('Succes', 'Te-ai înregistrat cu succes. Verificarea email-ului a fost trimisă.', [
                {
                  text: "Conectare",
                  onPress: () => {
                    navigation.goBack();
                  }
                }
              ]);
            }
          } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
              Alert.alert(
                "Email deja utilizat",
                "Adresa de email este deja utilizată de un alt cont.",
                [
                  { text: "OK" }
                ]
              );
            } else {
              console.error("Eroare la înregistrare:", error);
            }
          }
        },
        logout: async () => {
          try {
            await auth().signOut();
          } catch (e) {
            console.log(e);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
