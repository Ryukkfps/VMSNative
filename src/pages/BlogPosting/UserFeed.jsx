import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {API_URL} from '@env';
import {SERVER_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const POSTS_PER_PAGE = 10;
  const [SId, setSId] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchPosts();
  }, []);

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
          setSId(parsedHome.SId._id); // This SId state might be used elsewhere or for clarity

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
      console.error('Error fetching blog posts:', error);
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
      <View style={styles.centered}>
        <Text style={styles.postContent}>No Posts Available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
          <View style={styles.postCard}>
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
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No blog posts available</Text>
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.7}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Options Menu Modal */}
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
                navigation.navigate('CreatePost');
              }}>
              <Text style={styles.menuText}>Create New Post</Text>
            </TouchableOpacity>
            {/* Add more menu items here if needed */}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default UserFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    zIndex: 100,
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
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#eee', // fallback color
  },
});
