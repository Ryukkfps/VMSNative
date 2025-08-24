import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FloatingPlusButton = ({ onPress, visible = true, style, icon = '+', navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setMenuVisible(true);
    }
  };

  // Fixed original position: bottom-right with safe-area offset
  const fabStyle = [
    styles.fab,
    { bottom: Math.max(30, insets.bottom + 20) }, // Ensure button is above safe area
  ];

  return (
    <>
      <TouchableOpacity
        style={fabStyle}
        onPress={handlePress}
        activeOpacity={0.7}>
        <Text style={styles.fabIcon}>{icon}</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation?.navigate('CreatePost');
              }}>
              <Text style={styles.menuText}>Create New Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation?.navigate('PreApproved');
              }}>
              <Text style={styles.menuText}>Generate Invite Key</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    // bottom is now handled dynamically in the component
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    // Shadow: use elevation only on Android, shadow props only on iOS
    ...Platform.select({
      android: { elevation: 6, overflow: 'hidden' }, // clip to circle on Android only
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
      },
      default: {},
    }),
  },
  fabIcon: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
  },
  menuItem: {
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 18,
    color: '#007bff',
  },
});

export default FloatingPlusButton;