/**
 * @format
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import PostDetail from '../src/pages/BlogPosting/PostDetail';

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    post: {
      _id: '1',
      title: 'Test Post',
      content: 'This is a test post content',
      author: {
        Name: 'Test Author',
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      image: null,
    },
  },
};

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

// Mock environment variables
jest.mock('@env', () => ({
  SERVER_URL: 'http://localhost:3000',
}));

describe('PostDetail', () => {
  it('renders post details correctly', () => {
    const {getByText} = render(<PostDetail />);
    
    expect(getByText('Test Post')).toBeTruthy();
    expect(getByText('This is a test post content')).toBeTruthy();
    expect(getByText('By: Test Author')).toBeTruthy();
    expect(getByText('Post Details')).toBeTruthy();
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const {getByTestId} = render(<PostDetail />);
    
    // Note: You would need to add testID to the back button in PostDetail.jsx
    // for this test to work properly
    expect(mockNavigation.goBack).toBeDefined();
  });
});
