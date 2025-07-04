import { StyleSheet, Text, View, TextInput, Button, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { launchImageLibrary } from 'react-native-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';

const CreatePost = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null); // Change to object
  const [SId, setSId] = useState('');

  useEffect(() => {
  const fetchHome = async () => {
    try {
      const Home = await AsyncStorage.getItem('selectedHomeObject');
      if (Home) {
        console.log(Home)
        const parsedHome = JSON.parse(Home);
        console.log(parsedHome)
        if (parsedHome.SId && parsedHome.SId._id) {
          setSId(parsedHome.SId._id);
        }
        if (parsedHome.UserId && parsedHome.UserId._id) {
          setAuthor(parsedHome.UserId._id);
        }
      }
    } catch (e) {
      console.log('Error fetching Home:', e);
    }
  };
  fetchHome();
}, []);

  const handleImagePick = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setImage(response.assets[0]);
        }
      }
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    console.log("Submitting")
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author', author);
    formData.append('SId', SId);

    if (image) {
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });
    }

    console.log(formData)
    try {
      const response = await axios.post(
        `${API_URL}/blog-posts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const result = response.data;
      if (result) {
        navigation.navigate('Home');
      }
      console.log('Submitted:', result);
      // Reset form or navigate after submit
    } catch (error) {
      console.log('Error submitting post:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Blog Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
        <Text style={{ color: '#007bff' }}>
          {image ? 'Change Image' : 'Select Image'}
        </Text>
      </TouchableOpacity>
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 100, height: 100, marginBottom: 10, alignSelf: 'center' }}
        />
      )}
      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
    </SafeAreaView>
  )
}

export default CreatePost

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
})