import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { API_URL } from '@env';

const Feedback = () => {
    const [name, setName] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [image, setImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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
        console.log("")
        setSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('suggestion', suggestion);
        if (image) {
            formData.append('image', {
                uri: image.uri,
                type: image.type,
                name: image.fileName,
            });
        }
        try {
            const response = await axios.post(`${API_URL}/feedbacks`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            console.log(response.data)
        }
        catch(error){
            console.log(error)
        }
    setTimeout(() => {
            setSubmitting(false);
            setName('');
            setSuggestion('');
            setImage(null);
            alert('Feedback submitted!');
        }, 1000);

        setTimeout(() => {
            setSubmitting(false);
            setName('');
            setSuggestion('');
            setImage(null);
            alert('Feedback submitted!');
        }, 1000);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Feedback Form</Text>
            <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Suggestion or Bug Description"
                value={suggestion}
                onChangeText={setSuggestion}
                multiline
            />
            <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
                <Text style={{ color: '#007bff' }}>
                    {image ? 'Change Image' : 'Select Image (optional)'}
                </Text>
            </TouchableOpacity>
            {image && (
                <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                />
            )}
            <Button
                title={submitting ? 'Submitting...' : 'Submit'}
                onPress={handleSubmit}
                disabled={submitting || !name || !suggestion}
            />
        </ScrollView>
    );
};

export default Feedback;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    imagePicker: {
        alignItems: 'center',
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#eaf4ff',
        borderRadius: 8,
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 16,
    },
});