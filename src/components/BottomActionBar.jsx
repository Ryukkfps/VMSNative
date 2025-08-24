import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const BottomActionBar = ({ visible = true, navigation: navProp }) => {
  const insets = useSafeAreaInsets();
  const navigation = navProp || useNavigation();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(10, insets.bottom) },
      ]}
    >
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('CreatePost')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryText}>Create Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('PreApproved')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>Generate Invite Key</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 10,
    // Shadow: elevation on Android, shadow props on iOS
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
      default: {},
    }),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#e7f1ff',
    borderWidth: 1,
    borderColor: '#b3d1ff',
  },
  secondaryText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BottomActionBar;