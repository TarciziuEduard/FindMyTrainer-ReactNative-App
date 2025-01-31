import React, { useContext, useState } from 'react';
import { View, Text, Image, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmailIcon from '../imagini/login_img/email.png';
import PassIcon from '../imagini/login_img/password2.png';
import GmailIcon from '../imagini/login_img/gmail.png';
import FullNameIcon from '../imagini/login_img/full_name2.png';
import ConfirmPassIcon from '../imagini/login_img/confirm_password.png';
import BirthIcon from '../imagini/login_img/date_birth.png';
import DatePicker from 'react-native-date-picker';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { AuthContext } from '../Authentification/AuthProvider';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [FullName, setFullName] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [Birth, setBirth] = useState('');
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [dobLabel, setDobLabel] = useState('Date of Birth');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassError, setConfirmPassError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [birthError, setBirthError] = useState('');

  const { register, googleLogin } = useContext(AuthContext);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? '' : 'Formatul emailului este invalid.';
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength) {
      return 'Parola trebuie să aibă minim 6 caractere.';
    }
    if (!hasUpperCase) {
      return 'Parola trebuie să conțină cel puțin o literă mare.';
    }
    if (!hasSymbol) {
      return 'Parola trebuie să conțină cel puțin un simbol.';
    }
    return '';
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return 'Parolele nu se potrivesc.';
    }
    return '';
  };

  const handleEmailChange = (email) => {
    const trimmedEmail = email.trim(); 
    setEmail(trimmedEmail);
    setEmailError(validateEmail(trimmedEmail));
  };

  const handlePasswordChange = (password) => {
    setPassword(password);
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPassChange = (confirmPass) => {
    setConfirmPass(confirmPass);
    setConfirmPassError(validateConfirmPassword(password, confirmPass));
  };

  const handleFullNameChange = (fullName) => {
    setFullName(fullName);
    setFullNameError(fullName ? '' : 'Acest câmp este obligatoriu.');
  };

  const handleBirthChange = (birth) => {
    setBirth(birth);
    setBirthError(birth ? '' : 'Acest câmp este obligatoriu.');
  };

  const handleRegister = () => {
    const trimmedEmail = email.trim();
    const emailValidationError = validateEmail(trimmedEmail);
    const passwordValidationError = validatePassword(password);
    const confirmPassValidationError = validateConfirmPassword(password, confirmPass);
    const fullNameValidationError = FullName ? '' : 'Acest câmp este obligatoriu.';
    const birthValidationError = Birth ? '' : 'Acest câmp este obligatoriu.';

    if (
      emailValidationError ||
      passwordValidationError ||
      confirmPassValidationError ||
      fullNameValidationError ||
      birthValidationError
    ) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setConfirmPassError(confirmPassValidationError);
      setFullNameError(fullNameValidationError);
      setBirthError(birthValidationError);
      return;
    }

    register(email, password, FullName, confirmPass, Birth, navigation);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <ScrollView>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Image source={require('../imagini/login_img/Logo3.png')} style={styles.image} />
          </View>

          <Text style={styles.text}>Register</Text>

          <View style={styles.iconContainer}>
            <Image source={FullNameIcon} style={{ width: 35, height: 35 }} />
            <TextInput
              labelValue={FullName}
              onChangeText={handleFullNameChange}
              onBlur={() => setFullNameError(FullName ? '' : 'Acest câmp este obligatoriu.')}
              placeholder='Full Name'
              placeholderTextColor='rgba(255, 255, 255, 0.5)'
              style={{ flex: 1, color: 'white', fontSize: 20 }}
            />
          </View>
          {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

          <View style={styles.iconContainer}>
            <Image source={EmailIcon} style={styles.icon} />
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
            <Image source={PassIcon} style={styles.icon} />
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

          <View style={styles.iconContainer}>
            <Image source={ConfirmPassIcon} style={styles.icon} />
            <TextInput
              labelValue={confirmPass}
              onChangeText={handleConfirmPassChange}
              onBlur={() => setConfirmPassError(validateConfirmPassword(password, confirmPass))}
              placeholder='Confirm Password'
              placeholderTextColor='rgba(255, 255, 255, 0.5)'
              secureTextEntry={true}
              style={{ flex: 1, color: 'white', fontSize: 20 }}
            />
          </View>
          {confirmPassError ? <Text style={styles.errorText}>{confirmPassError}</Text> : null}

          <View style={styles.iconContainer}>
            <Image source={BirthIcon} style={styles.icon} />
            <TouchableOpacity onPress={() => setOpen(true)}>
              <Text
                labelValue={Birth}
                onChangeText={handleBirthChange}
                style={{ flex: 1, color: 'rgba(255, 255, 255, 0.5)', fontSize: 20, marginTop: 5, marginLeft: 5 }}>
                {dobLabel}
              </Text>
            </TouchableOpacity>

            <DatePicker
              modal
              open={open}
              date={date}
              mode={'date'}
              maximumDate={new Date('2006-01-01')}
              minimumDate={new Date('1940-01-01')}
              onConfirm={(date) => {
                setOpen(false);
                setDate(date);
                setDobLabel(format(date, 'dd MMMM yyyy', { locale: ro }));
                handleBirthChange(format(date, 'dd MMMM yyyy', { locale: ro }));
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
          </View>
          {birthError ? <Text style={styles.errorText}>{birthError}</Text> : null}

        </View>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={{ fontSize: 20, color: 'black', fontWeight: '700', textAlign: 'center' }}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.otherLoginContainer}>Or, register with...</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => googleLogin()}>
              <Image source={GmailIcon} style={{ width: 65, height: 65 }} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20, marginRight: 10 }}>Already registered?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ flex: 1, color: 'yellow', fontSize: 20 }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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

export default RegisterScreen;
