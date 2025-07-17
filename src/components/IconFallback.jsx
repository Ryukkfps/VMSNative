import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faAdd, 
  faSearch, 
  faChat, 
  faClose, 
  faError, 
  faArrowBack, 
  faAttachFile, 
  faSend, 
  faMoreVert, 
  faDone, 
  faDoneAll 
} from '@fortawesome/free-solid-svg-icons';

const iconMap = {
  add: faAdd,
  search: faSearch,
  chat: faChat,
  close: faClose,
  error: faError,
  'arrow-back': faArrowBack,
  'attach-file': faAttachFile,
  send: faSend,
  'more-vert': faMoreVert,
  done: faDone,
  'done-all': faDoneAll,
};

const IconFallback = ({ name, size = 24, color = '#000', style }) => {
  const faIcon = iconMap[name];
  
  if (faIcon) {
    return (
      <FontAwesomeIcon 
        icon={faIcon} 
        size={size} 
        color={color} 
        style={style} 
      />
    );
  }
  
  // Fallback to text-based icons
  const textIcons = {
    add: '+',
    search: '🔍',
    chat: '💬',
    close: '✕',
    error: '❌',
    'arrow-back': '←',
    'attach-file': '📎',
    send: '→',
    'more-vert': '⋮',
    done: '✓',
    'done-all': '✓✓',
  };
  
  const textIcon = textIcons[name] || '?';
  
  return (
    <Text style={[styles.textIcon, { fontSize: size, color }, style]}>
      {textIcon}
    </Text>
  );
};

const styles = StyleSheet.create({
  textIcon: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default IconFallback;
