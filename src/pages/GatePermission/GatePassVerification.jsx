import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { API_URL } from '@env';

const GatePassVerification = () => {
  const navigation = useNavigation();
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // API call to validate entry permit
  const verifyPasskey = async (passkeyValue) => {
    try {
      console.log('Verifying passkey:', passkeyValue);
      console.log('API URL:', `${API_URL}/entry-permits/validate/${passkeyValue}`);

      const response = await axios.get(`${API_URL}/entry-permits/validate/${passkeyValue}`);

      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);

      // Handle different types of API errors
      if (error.response) {
        // Server responded with error status
        console.log('Error response data:', error.response.data);
        console.log('Error status:', error.response.status);

        // If the server returns a structured error response, use it
        if (error.response.data && typeof error.response.data === 'object') {
          return error.response.data;
        }

        // For other HTTP errors, return a generic invalid response
        return {
          valid: false,
          message: error.response.data?.message || "Entry permit not found"
        };
      } else if (error.request) {
        // Network error - no response received
        console.log('Network error - no response received');
        throw new Error('Network error - please check your connection');
      } else {
        // Other error
        console.log('Request setup error:', error.message);
        throw new Error('Failed to verify passkey');
      }
    }
  };

  const handleVerify = async () => {
    if (!passkey.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a passkey',
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const result = await verifyPasskey(passkey);
      setVerificationResult(result);

      if (result.valid) {
        Toast.show({
          type: 'success',
          text1: 'Verification Successful',
          text2: 'Entry permit is valid',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: result.message || 'Entry permit is invalid',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to connect to server. Please check your connection.',
      });
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPasskey('');
    setVerificationResult(null);
  };

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    return (
      <View style={styles.resultContainer}>
        <View style={[
          styles.resultCard,
          verificationResult.valid ? styles.validCard : styles.invalidCard
        ]}>
          <View style={styles.resultHeader}>
            <FontAwesomeIcon
              icon={verificationResult.valid ? faCheckCircle : faTimesCircle}
              size={32}
              color={verificationResult.valid ? '#28a745' : '#dc3545'}
            />
            <Text style={[
              styles.resultTitle,
              { color: verificationResult.valid ? '#28a745' : '#dc3545' }
            ]}>
              {verificationResult.valid ? 'VALID ENTRY PERMIT' : 'INVALID ENTRY PERMIT'}
            </Text>
          </View>

          {verificationResult.valid && verificationResult.unitName && (
            <View style={styles.unitDetails}>
              <Text style={styles.detailsTitle}>Unit Details:</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Society:</Text>
                <Text style={styles.detailValue}>{verificationResult.societyName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Block:</Text>
                <Text style={styles.detailValue}>{verificationResult.blockName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unit:</Text>
                <Text style={styles.detailValue}>{verificationResult.unitName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{verificationResult.name}</Text>
              </View>
            </View>
          )}

          {!verificationResult.valid && verificationResult.unitName && (
            <View style={styles.unitDetails}>
              <Text style={styles.detailsTitle}>Unit Details:</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Society:</Text>
                <Text style={styles.detailValue}>{verificationResult.societyName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Block:</Text>
                <Text style={styles.detailValue}>{verificationResult.blockName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unit:</Text>
                <Text style={styles.detailValue}>{verificationResult.unitName}</Text>
              </View>
              <Text style={styles.invalidMessage}>
                Entry permit has expired or been revoked
              </Text>
            </View>
          )}

          {!verificationResult.valid && verificationResult.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.errorMessage}>{verificationResult.message}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Verify Another Passkey</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gate Pass Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputSection}>
          <Text style={styles.instructionText}>
            Enter the passkey to verify entry permit
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Passkey"
            value={passkey}
            onChangeText={setPasskey}
            keyboardType="default"
            autoCapitalize="characters"
            maxLength={20}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Passkey</Text>
            )}
          </TouchableOpacity>
        </View>

        {renderVerificationResult()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GatePassVerification;

const styles = StyleSheet.create({
  container: {
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
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  validCard: {
    backgroundColor: '#f8fff9',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  invalidCard: {
    backgroundColor: '#fff8f8',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  unitDetails: {
    marginTop: 15,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  invalidMessage: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ffe6e6',
    borderRadius: 6,
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageContainer: {
    marginTop: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});