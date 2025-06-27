import { StyleSheet, Text, View, TextInput, Button } from 'react-native'
import React, { useState } from 'react'
import axios from 'axios'
import {API_URL} from '@env'
import { storeToken } from '../../utils/dbStore';
import {jwtDecode} from 'jwt-decode';
const Register = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    try {

      const datatosend = {
        Name : name,
        Email : email, 
        Phone : phone
      }
      console.log(datatosend)
      console.log(API_URL)
      const response = await axios.post(`${API_URL}/users`, {
        Name: name,
        Email: email,
        Phone: phone
      });
      console.log(response.data)
      const token = response.data?.token;
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      
      if (token && userId) {
        await storeToken(token);
      }
      alert('User registered successfully');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      navigation.navigate('Home')
    } catch (error) {
      console.error('There was a problem with the registration:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Button title="Register" onPress={handleRegister} />
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
})