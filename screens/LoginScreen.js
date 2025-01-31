import React, { useContext, useState,useEffect } from 'react';
import { View, Text, Image, TextInput, StyleSheet, TouchableOpacity,Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmailIcon from '../imagini/login_img/email.png';
import PassIcon from '../imagini/login_img/password2.png';
import GmailIcon from '../imagini/login_img/gmail.png';
import { AuthContext } from '../Authentification/AuthProvider';
import { ScrollView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, googleLogin } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        Alert.alert(
          'Eroare de rețea',
          'Te rugăm să activezi conexiunea la internet pentru a putea folosi aplicația'
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const validateEmail = (email) => {
    return email ? '' : 'Introduceți emailul.';
  };

  const validatePassword = (password) => {
    return password ? '' : 'Introduceți parola.';
  };

  const handleEmailChange = (email) => {
    setEmail(email);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (password) => {
    setPassword(password);
    setPasswordError(validatePassword(password));
  };

  const handleLogin = () => {
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      return;
    }

    login(email, password);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <ScrollView>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../imagini/login_img/Logo3.png')}
            style={styles.image}
          />
        </View>
        <Text style={styles.text}>Login</Text>

        <View style={styles.iconContainer}>
          <Image
            source={EmailIcon}
            style={styles.icon}
          />
          <TextInput
            labelValue={email}
            onChangeText={handleEmailChange}
            onBlur={() => setEmailError(validateEmail(email))}
            placeholder='Email'
            placeholderTextColor='rgba(255, 255, 255, 0.5)'
            style={{ flex: 1, color: 'white', fontSize: 20 }}
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={styles.iconContainer}>
          <Image
            source={PassIcon}
            style={styles.icon}
          />
          <TextInput
            labelValue={password}
            onChangeText={handlePasswordChange}
            onBlur={() => setPasswordError(validatePassword(password))}
            placeholder='Password'
            placeholderTextColor='rgba(255, 255, 255, 0.5)'
            secureTextEntry={true}
            style={{ flex: 1, color: 'white', fontSize: 20 }}
          />
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={{ fontSize: 20, color: 'black', fontWeight: '700', textAlign: 'center' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.otherLoginContainer}>Or, login with...</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={() => googleLogin()}>
            <Image
              source={GmailIcon}
              style={{ width: 65, height: 65 }}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20, marginRight: 10 }}>New to the app?</Text>
        <TouchableOpacity onPress={() => { navigation.navigate('Register') }}>
          <Text style={{ flex: 1, color: 'yellow', fontSize: 20 }}>Register</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Roboto-Medium',
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    color: 'yellow',
    marginBottom: 20,
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    width: '40%',
  },
  image: {
    height: 280,
    width: 400,
  },
  iconContainer: {
    flexDirection: 'row',
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    paddingBottom: 1,
    marginBottom: 25,
    width: '100%',
    colorText: 'white',
  },
  buttonContainer: {
    backgroundColor: 'yellow',
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
    width: '80%',
  },
  otherLoginContainer: {
    color: 'white',
    fontSize: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 20,
    marginTop: -20,
  },
});

export default LoginScreen;
