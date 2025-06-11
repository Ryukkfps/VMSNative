import { StyleSheet, Text, View, TextInput, Button, ScrollView, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { launchImageLibrary } from 'react-native-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env';
import axios from 'axios';

const CreatePost = () => {
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

  const handleSubmit = async () => {
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
      console.log('Submitted:', result);
      // Reset form or navigate after submit
    } catch (error) {
      console.log('Error submitting post:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Blog Post</Text>
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
  )
}

export default CreatePost

const styles = StyleSheet.create({
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