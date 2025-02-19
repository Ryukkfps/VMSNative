import { StyleSheet, Text, View, FlatList, Dimensions, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

const GetStarted = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Sample carousel data - replace images with your actual image paths
  const carouselData = [
    { 
      id: '1', 
      image: require('../../../assets/images/welcome.jpg'),
      title: 'Welcome to Our App',
      description: 'Start your journey with us today'
    },
    { 
      id: '2', 
      image: require('../../../assets/images/track.jpg'),
      title: 'Track Your Progress',
      description: 'Monitor your activities in real-time'
    },
    { 
      id: '3', 
      image: require('../../../assets/images/welcome.jpg'),
      title: 'Join Our Community',
      description: 'Connect with like-minded people'
    },
  ]

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    )
  }

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = scrollPosition / width
    setCurrentIndex(Math.round(index))
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={carouselData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
      />
      
      {/* Pagination dots */}
      <View style={styles.pagination}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#000' : '#ccc' }
            ]}
          />
        ))}
      </View>

      {/* Show Get Started Button only on last slide */}
      {currentIndex === carouselData.length - 1 && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default GetStarted

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: width,
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    position: 'absolute',
    bottom: 80,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
})