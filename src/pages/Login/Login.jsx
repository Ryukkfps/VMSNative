import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import axios from 'axios'
import { storeToken, getToken } from '../../utils/dbStore';

const Login = ({navigation}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpinput, setOtpinput] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)

  const handleSendOtp = async () => {
    try{
      const datatosend = {
        email : emailOrPhone
      }
      const response = await axios.post('http://10.0.2.2:5133/api/Login/SentEMAILOTP',datatosend);
      setOtp(response.data?.EmailOTP)
      setIsOtpSent(true)
      alert('OTP sent successfully')
    }catch(error){
      console.log(error)
    }
  };

  const handleVerifyOtp = async () => {
    if (otpinput === otp) {

      const response = await axios.post('http://10.0.2.2:5133/api/Login/Token', {
        email : emailOrPhone,
      })
      const token = response.data?.token
      const stored = await storeToken(token);
      alert('OTP verified successfully')
      navigation.navigate('Home')
    } else {
      alert('Invalid OTP')
    }
    // Navigate to the main application screen upon successful verification
  }

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
          <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text> 
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.registerButton}
      onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Login

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
})