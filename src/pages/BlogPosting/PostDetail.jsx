import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SERVER_URL, API_URL } from '@env';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '../../utils/dbStore';

const PostDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post } = route.params;

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // comment id being replied to
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      setError(null);
      const response = await axios.get(`${API_URL}/blog-posts/${post._id}/comments`);
      console.log("")
      setComments(response.data.comments || []);
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Helper: Convert flat comments array to nested tree
  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];
    comments.forEach(comment => {
      map[comment._id] = {...comment, replies: []};
    });
    comments.forEach(comment => {
      if (comment.parentId) {
        if (map[comment.parentId]) {
          map[comment.parentId].replies.push(map[comment._id]);
        }
      } else {
        roots.push(map[comment._id]);
      }
    });
    return roots;
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    setError(null);
    try {
      // Optionally get user info from AsyncStorage
      const token = await getToken();
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      const userResponse = await axios.get(`${API_URL}/users/${userId}`);
      const userName = userResponse.data?.Name || 'Anonymous';
      await axios.post(`${API_URL}/blog-posts/${post._id}/comments`, {
        content: commentText,
        userId,
        userName,
        parentId: replyTo || null,
      });
      setCommentText('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      setError('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const renderNestedComments = (comments, level = 0) => {
    return comments.map(comment => (
      <View key={comment._id} style={[styles.commentCard, { marginLeft: level * 20 }]}> 
        <Text style={styles.commentAuthor}>{comment.userName || 'User'}</Text>
        <Text style={styles.commentContent}>{comment.content}</Text>
        <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => {
            setReplyTo(comment._id);
            setCommentText('');
          }}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
        {/* If replying to this comment, show input */}
        {replyTo === comment._id && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              value={commentText}
              onChangeText={setCommentText}
              editable={!postingComment}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={styles.replySendButton}
              onPress={handleAddComment}
              disabled={postingComment || !commentText.trim()}
            >
              <Text style={styles.replySendButtonText}>{postingComment ? 'Posting...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Render replies recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {renderNestedComments(comment.replies, level + 1)}
          </View>
        )}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.postContainer}>
          {/* Post Image */}
          {post.image ? (
            <Image
              source={{
                uri: `${SERVER_URL}/${post.image
                  .replace(/\\\\/g, '/')
                  .replace(/\\/g, '/')}`,
              }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Post Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.postTitle}>{post.title}</Text>

            <View style={styles.metaContainer}>
              <Text style={styles.postAuthor}>
                By: {post.author?.Name || 'Unknown'}
              </Text>
              <Text style={styles.postDate}>
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentHeader}>Comments</Text>
          {loadingComments ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />
          ) : error ? (
            <Text style={styles.commentError}>{error}</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          ) : (
            <View style={{ paddingBottom: 10 }}>
              {renderNestedComments(buildCommentTree(comments))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            editable={!postingComment}
            multiline
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => {
              setReplyTo(null);
              handleAddComment();
            }}
            disabled={postingComment || !commentText.trim()}
          >
            <Text style={styles.commentButtonText}>{postingComment ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  commentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  commentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  commentCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  commentContent: {
    fontSize: 15,
    color: '#444',
    marginVertical: 2,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  noCommentsText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 10,
  },
  commentError: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e1ecf7',
    borderRadius: 12,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  replyInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 6,
  },
  replySendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replySendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  repliesContainer: {
    marginTop: 2,
  },
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
  scrollContainer: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  metaContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  postAuthor: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  postContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    textAlign: 'justify',
  },
});

export default PostDetail;
