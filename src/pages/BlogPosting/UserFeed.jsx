import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {API_URL} from '@env';
import {SERVER_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import FloatingPlusButton from '../../components/FloatingPlusButton/FloatingPlusButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;
  const navigation = useNavigation();

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setError(null); // Clear previous errors on refresh
        setPage(1);
      } else if (loading && page === 1) {
        // Initial load already in progress
        return;
      } else {
        setLoadingMore(true);
      }

      const Home = await AsyncStorage.getItem('selectedHomeObject');
      if (Home) {
        console.log('Retrieved Home from AsyncStorage:', Home);
        const parsedHome = JSON.parse(Home);
        console.log('Parsed Home:', parsedHome);

        if (parsedHome.SId && parsedHome.SId._id) {
          const currentPage = refresh ? 1 : page;
          const response = await axios.get(
            `${API_URL}/blog-posts/society/${parsedHome.SId._id}`,
            {
              params: {
                page: currentPage,
                limit: POSTS_PER_PAGE,
              },
            },
          );

          const newPosts = response.data.posts;
          console.log(newPosts);

          if (refresh || page === 1) {
            setPosts(newPosts);
          } else {
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
          }

          setHasMore(newPosts.length === POSTS_PER_PAGE);
          if (!refresh) setPage(prevPage => prevPage + 1); // Use functional update for page
        } else {
          console.error('SId or SId._id not found in parsedHome:', parsedHome);
          setError('Society ID not found. Cannot fetch posts.');
          setPosts([]); // Clear posts if SId is missing
          setHasMore(false);
        }
      } else {
        console.warn('selectedHomeObject not found in AsyncStorage');
        setError('No society selected. Please select a society to see posts.');
        setPosts([]); // Clear posts if no home is selected
        setHasMore(false);
      }
    } catch (error) {
      //  
      // Check if the error is from axios or other parts
      if (axios.isAxiosError(error)) {
        setError(`Failed to load blog posts: ${error.message}`);
      } else {
        setError('An unexpected error occurred while fetching posts.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    if (!loading && !loadingMore) {
      fetchPosts(true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchPosts();
    }
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text style={styles.loadingMoreText}>Loading more posts...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.postContent}>No Posts Available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <FloatingPlusButton navigation={navigation} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Blog Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.postCard}
            onPress={() => handlePostPress(item)}
            activeOpacity={0.7}
          >
            {item.image ? (
              <Image
                source={{
                  uri: `${SERVER_URL}/${item.image
                    .replace(/\\\\/g, '/')
                    .replace(/\\/g, '/')}`,
                }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
            <Text style={styles.postAuthor}>
              By: {item.author?.Name || 'Unknown'}
            </Text>
            <Text style={styles.postDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No blog posts available</Text>
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={loading}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.flatListContent}
      />

      {/* FloatingPlusButton moved outside the FlatList context */}
      <FloatingPlusButton navigation={navigation} />
    </View>
  );
};

export default UserFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    position: 'relative', // Add this to establish positioning context
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Add space for floating button
  },
  flatListContent: {
    paddingBottom: 100, // Add space for floating button
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: 12,
    color: '#666',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#eee', // fallback color
  },
});
