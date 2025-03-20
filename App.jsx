import { StyleSheet } from 'react-native'
import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import Toast from 'react-native-toast-message'

const App = () => {
  return (
    <>
      <AppNavigator />
      <Toast />
    </>
  );
}

export default App

const styles = StyleSheet.create({})