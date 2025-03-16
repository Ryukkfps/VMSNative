import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Navbar from '../../components/Navbar/Navbar'
import { getToken } from '../../utils/dbStore'


const HomePage = () => {
  const token = getToken();
  return (
    <View>
        <Navbar/>
      <Text>HomePage</Text>
    </View>
  )
}

export default HomePage

const styles = StyleSheet.create({})