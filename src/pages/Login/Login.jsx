import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import axios from 'axios';
import {storeToken, storeUserRole} from '../../utils/dbStore';
import {API_URL} from '@env';
import Toast from 'react-native-toast-message';
import {sendFcmTokenToBackend} from '../../../firebaseConfig';
import {jwtDecode} from 'jwt-decode';

const Login = ({navigation}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpinput, setOtpinput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Function to send OTP
  const handleSendOtp = async () => {
    console.log("SendingOTP")
    try {
      if (!emailOrPhone) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter email or phone number',
        });
        return;
      }
      console.log(API_URL)
      const response = await axios.post(`${API_URL}/login/sentemailloginotp`, {
        email: emailOrPhone,
      });
      console.log(response.data?.EmailOTP)
      setOtp(response.data?.EmailOTP);
      setIsOtpSent(true);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'Please check your email/phone.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to send OTP',
      });
      console.error('Send OTP Error:', error);
    }
  };

  // Function to verify OTP and login
  const handleVerifyOtp = async () => {
    try {
      if (!otpinput) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter OTP',
        });
        return;
      }
      console.log(otpinput)
      if (otpinput == otp) {
        const response = await axios.post(`${API_URL}/login/token`, {
          email: emailOrPhone,
          otp: otpinput,
        });

        const token = response.data?.token;
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        if (token && userId) {
          await storeToken(token);
          
          // Fetch user role
          try {
            const roleResponse = await axios.get(`${API_URL}/users/${userId}/role`);
            const userRole = roleResponse.data?.roleName;
            
            // Store user role in AsyncStorage
            if (userRole) {
              await storeUserRole(userRole);
            }
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
          }
          
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome back!',
          });

          // Send FCM Token to the backend
          await sendFcmTokenToBackend(userId);

          // Navigate to Home Screen
          navigation.navigate('Home');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: 'Invalid response from server',
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid OTP',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to verify OTP',
      });
      console.error('Verify OTP Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {!isOtpSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otpinput}
            onChangeText={setOtpinput}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleVerifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
