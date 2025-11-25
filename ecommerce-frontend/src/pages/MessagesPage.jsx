// src/pages/MessagesPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { messageService, productService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/MessagesPage.css';

const MessagesPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const newProductId = queryParams.get('product');
    const newSellerId = queryParams.get('seller');

    // State for conversations and messages
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [currentConversationData, setCurrentConversationData] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);
    const [startingNewConversation, setStartingNewConversation] = useState(false);
    const [initialMessage, setInitialMessage] = useState('');

    // Ref for message list to scroll to bottom
    const messagesEndRef = useRef(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname + location.search } });
        }
    }, [isAuthenticated, navigate, location]);

    // Check if we need to start a new conversation
    useEffect(() => {
        const checkNewConversation = async () => {
            if (newProductId && newSellerId && isAuthenticated) {
                try {
                    // Clear URL params immediately to avoid repeat processing
                    // This prevents the URL params from being processed again if the component re-renders
                    //navigate('/messages', { replace: true });

                    // Check if we're trying to message ourselves
                    if (newSellerId === user.id.toString()) {
                        setError("You cannot message yourself");
                        return;
                    }

                    // First check if we already have conversations loaded
                    let existingConvo = null;
                    let allConversations = [];

                    // Check if we need to fetch conversations or already have them
                    if (conversations.length > 0) {
                        allConversations = conversations;
                        existingConvo = conversations.find(
                            c => c.product_id && c.product_id.toString() === newProductId
                        );
                    } else {
                        // Fetch conversations first
                        try {
                            const response = await messageService.getUserConversations();
                            if (response.data && response.data.conversations) {
                                allConversations = response.data.conversations;
                                setConversations(allConversations);
                                existingConvo = allConversations.find(
                                    c => c.product_id && c.product_id.toString() === newProductId
                                );
                            }
                        } catch (err) {
                            console.error('Error fetching conversations:', err);
                            setError('Error checking existing conversations');
                            return;
                        }
                    }

                    if (existingConvo) {
                        // Conversation exists, set it as active and load it
                        setActiveConversation(existingConvo.id);
                        setStartingNewConversation(false);
                        setCurrentConversationData(null);
                        setError(null);

                        try {
                            const response = await messageService.getConversationById(existingConvo.id);

                            if (response.data && response.data.conversation) {
                                const convo = response.data.conversation;

                                // Find the other participant (not current user)
                                const otherParticipant = convo.participants.find(p => p.user_id !== user.id);

                                if (!otherParticipant) {
                                    console.error('Could not find other participant in conversation');
                                    setError('Error loading conversation details');
                                    return;
                                }

                                setCurrentConversationData({
                                    id: convo.id,
                                    product: {
                                        id: convo.product_id,
                                        name: convo.product_name,
                                        price: convo.product_price,
                                        image: convo.product_image
                                    },
                                    with: {
                                        id: otherParticipant.user_id,
                                        name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
                                        avatar: otherParticipant.avatar
                                    },
                                    messages: convo.messages
                                });

                                // Mark as read
                                await messageService.markAsRead(existingConvo.id);

                                // Update unread count in conversations list
                                setConversations(prevConversations =>
                                    prevConversations.map(c =>
                                        c.id === existingConvo.id ? { ...c, unread_count: 0 } : c
                                    )
                                );
                            }
                        } catch (err) {
                            console.error('Error fetching conversation:', err);
                            setError('Failed to load conversation messages. Please try again.');
                        }
                    } else {
                        // New conversation - prepare UI for starting a new conversation
                        setStartingNewConversation(true);
                        setActiveConversation(null);

                        // Get product details to show in the UI
                        try {
                            const productResponse = await productService.getProductById(newProductId);

                            if (!productResponse.data || !productResponse.data.product) {
                                setError('Product not found');
                                setStartingNewConversation(false);
                                return;
                            }

                            const product = productResponse.data.product;

                            setCurrentConversationData({
                                product: {
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.images && product.images.length > 0
                                        ? product.images[0].image_url
                                        : product.image || null  // Fallback to product.image if images array doesn't exist
                                },
                                with: {
                                    id: parseInt(newSellerId),
                                    name: `${product.seller_first_name || ''} ${product.seller_last_name || ''}`,
                                    avatar: product.seller_avatar
                                },
                                messages: []
                            });
                        } catch (err) {
                            console.error('Error fetching product details:', err);
                            setError('Error loading product details');
                            setStartingNewConversation(false);
                        }
                    }
                } catch (err) {
                    console.error('Error checking existing conversations:', err);
                    setError('Error checking existing conversations');
                }
            }
        };

        // Only run this effect when necessary
        if (newProductId && newSellerId && isAuthenticated) {
            checkNewConversation();
        }
    }, [newProductId, newSellerId, isAuthenticated, user, navigate, conversations]);

    // Fetch conversations on component mount
    useEffect(() => {
        const fetchConversations = async () => {
            if (!isAuthenticated) return;

            setLoading(true);
            setError(null);

            try {
                const response = await messageService.getUserConversations();

                if (response.data && response.data.conversations) {
                    setConversations(response.data.conversations);

                    // If we have a conversationId in URL or from previous checks, activate it
                    if (activeConversation) {
                        const found = response.data.conversations.find(c => c.id === activeConversation);
                        if (found) {
                            handleConversationClick(activeConversation);
                        } else if (response.data.conversations.length > 0) {
                            // If not found but we have conversations, set the first one active
                            handleConversationClick(response.data.conversations[0].id);
                        }
                    } else if (response.data.conversations.length > 0 && !startingNewConversation) {
                        // If no active conversation and we have conversations, set the first one active
                        handleConversationClick(response.data.conversations[0].id);
                    }
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setError('Failed to load conversations. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [isAuthenticated, activeConversation, startingNewConversation]);

    // Scroll to bottom of messages when they change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentConversationData]);

    // Handle conversation click
    const handleConversationClick = async (conversationId) => {
        if (conversationId === activeConversation) return;

        setActiveConversation(conversationId);
        setStartingNewConversation(false);
        setCurrentConversationData(null);
        setError(null);

        try {
            const response = await messageService.getConversationById(conversationId);

            if (response.data && response.data.conversation) {
                const convo = response.data.conversation;

                // Find the other participant (not current user)
                const otherParticipant = convo.participants.find(p => p.user_id !== user.id);

                setCurrentConversationData({
                    id: convo.id,
                    product: {
                        id: convo.product_id,
                        name: convo.product_name,
                        price: convo.product_price,
                        image: convo.product_image
                    },
                    with: {
                        id: otherParticipant.user_id,
                        name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
                        avatar: otherParticipant.avatar
                    },
                    messages: convo.messages
                });

                // Mark as read
                await messageService.markAsRead(conversationId);

                // Update unread count in conversations list
                setConversations(prevConversations =>
                    prevConversations.map(c =>
                        c.id === conversationId ? { ...c, unread_count: 0 } : c
                    )
                );
            }
        } catch (err) {
            console.error('Error fetching conversation:', err);
            setError('Failed to load conversation messages. Please try again.');
        }
    };

    // Handle starting a new conversation
    const handleStartConversation = async () => {
        if (!initialMessage.trim()) return;

        setSendingMessage(true);
        setError(null);

        try {
            const response = await messageService.createConversation(newProductId, initialMessage);

            if (response.data && response.data.conversationId) {
                // Clear URL params
                navigate('/messages');

                // Reset states
                setStartingNewConversation(false);
                setInitialMessage('');

                // Set the new conversation as active
                setActiveConversation(response.data.conversationId);

                // Refresh conversations list
                const convoResponse = await messageService.getUserConversations();
                if (convoResponse.data && convoResponse.data.conversations) {
                    setConversations(convoResponse.data.conversations);
                }

                // Load the new conversation
                await handleConversationClick(response.data.conversationId);
            }
        } catch (err) {
            console.error('Error starting conversation:', err);
            setError('Failed to start conversation. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !activeConversation) return;

        setSendingMessage(true);

        try {
            await messageService.sendMessage(activeConversation, newMessage);

            // Update the conversation in the UI with the new message
            if (currentConversationData) {
                const newMsg = {
                    id: Date.now(), // Temporary ID until refresh
                    sender_id: user.id,
                    text: newMessage,
                    timestamp: new Date().toISOString(),
                    is_read: true,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    avatar: user.avatar
                };

                setCurrentConversationData(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMsg]
                }));
            }

            // Clear input
            setNewMessage('');

            // Refresh conversations list to update last message preview
            const response = await messageService.getUserConversations();
            if (response.data && response.data.conversations) {
                setConversations(response.data.conversations);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    // Format time
    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch (err) {
            return '';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            return '';
        }
    };

    // Helper to get image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/placeholder-image.jpg';

        // Check if the image URL is already a full URL
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // If it starts with /uploads/, prepend the API URL
        if (imageUrl.startsWith('/uploads/')) {
            // For Vite, use import.meta.env instead of process.env
            const apiBase = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace('/api', '')
                : '';
            return `${apiBase}${imageUrl}`;
        }

        // If it's an absolute path but not starting with /uploads/
        if (imageUrl.startsWith('/')) {
            return imageUrl;
        }

        // Return placeholder if image is not available
        return '/placeholder-image.jpg';
    };

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="messages-page">
            <div className="messages-header">
                <h1>Messages</h1>
                {error && <div className="error-message">{error}</div>}
            </div>

            <div className="messages-container">
                {/* Conversations List */}
                <div className="conversations-list">
                    {loading && conversations.length === 0 ? (
                        <div className="loading-indicator">Loading conversations...</div>
                    ) : conversations.length > 0 ? (
                        conversations.map(convo => (
                            <div
                                key={convo.id}
                                className={`conversation-item ${activeConversation === convo.id ? 'active' : ''} ${convo.unread_count > 0 ? 'unread' : ''}`}
                                onClick={() => handleConversationClick(convo.id)}
                            >
                                <div className="conversation-avatar">
                                    <img
                                        src={getImageUrl(convo.other_user_avatar)}
                                        alt={convo.other_user_name}
                                        onError={(e) => {
                                            e.target.src = 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png';
                                            e.target.onerror = null;
                                        }}
                                    />
                                </div>

                                <div className="conversation-info">
                                    <div className="conversation-header">
                                        <h3>{convo.other_user_name}</h3>
                                        <span className="conversation-time">
                                            {formatTime(convo.last_message_time)}
                                        </span>
                                    </div>

                                    <p className="conversation-preview">
                                        {convo.last_message && (
                                            <>
                                                {parseInt(convo.last_sender_id) === user.id ? 'You: ' : ''}
                                                {convo.last_message.substring(0, 40)}
                                                {convo.last_message.length > 40 ? '...' : ''}
                                            </>
                                        )}
                                    </p>

                                    <div className="conversation-meta">
                                        <span className="product-name">
                                            Re: {convo.product_name}
                                        </span>

                                        {convo.unread_count > 0 && (
                                            <span className="unread-badge">
                                                {convo.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-conversations-message">
                            {!loading && !startingNewConversation && (
                                <p>You don't have any conversations yet.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Active Conversation or New Conversation */}
                {startingNewConversation && currentConversationData ? (
                    <div className="conversation-window">
                        {/* New Conversation Header */}
                        <div className="conversation-window-header">
                            <div className="user-info">
                                <img
                                    src={getImageUrl(currentConversationData.with.avatar)}
                                    alt={currentConversationData.with.name}
                                    className="user-avatar"
                                    onError={(e) => {
                                        e.target.src = 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png';
                                        e.target.onerror = null;
                                    }}
                                />
                                <div className="user-details">
                                    <h3>{currentConversationData.with.name}</h3>
                                </div>
                            </div>

                            <div className="product-info">
                                <span>Regarding:</span>
                                <Link to={`/product/${currentConversationData.product.id}`} className="product-link">
                                    <img
                                        src={getImageUrl(currentConversationData.product.image)}
                                        alt={currentConversationData.product.name}
                                        className="product-image"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <div className="product-details">
                                        <h4>{currentConversationData.product.name}</h4>
                                        <p>${parseFloat(currentConversationData.product.price).toFixed(2)}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* New Conversation Input */}
                        <div className="new-conversation-container">
                            <div className="new-conversation-prompt">
                                <p>Start a conversation with {currentConversationData.with.name} about this product:</p>
                            </div>

                            <textarea
                                placeholder="Write your message here..."
                                value={initialMessage}
                                onChange={(e) => setInitialMessage(e.target.value)}
                                className="new-conversation-textarea"
                                rows={4}
                            />

                            <button
                                onClick={handleStartConversation}
                                className="send-button start-conversation-button"
                                disabled={!initialMessage.trim() || sendingMessage}
                            >
                                {sendingMessage ? 'Sending...' : 'Start Conversation'}
                            </button>
                        </div>
                    </div>
                ) : currentConversationData ? (
                    <div className="conversation-window">
                        {/* Conversation Header */}
                        <div className="conversation-window-header">
                            <div className="user-info">
                                <img
                                    src={getImageUrl(currentConversationData.with.avatar)}
                                    alt={currentConversationData.with.name}
                                    className="user-avatar"
                                    onError={(e) => {
                                        e.target.src = 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png';
                                        e.target.onerror = null;
                                    }}
                                />
                                <div className="user-details">
                                    <h3>{currentConversationData.with.name}</h3>
                                </div>
                            </div>

                            <div className="product-info">
                                <span>Regarding:</span>
                                <Link to={`/product/${currentConversationData.product.id}`} className="product-link">
                                    <img
                                        src={getImageUrl(currentConversationData.product.image)}
                                        alt={currentConversationData.product.name}
                                        className="product-image"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <div className="product-details">
                                        <h4>{currentConversationData.product.name}</h4>
                                        <p>${parseFloat(currentConversationData.product.price).toFixed(2)}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="messages-list">
                            {currentConversationData.messages.map((message, index) => {
                                // Check if this is the first message of a new day
                                const showDateSeparator = index === 0 ||
                                    formatDate(message.timestamp) !== formatDate(currentConversationData.messages[index - 1].timestamp);

                                // Determine if message is from current user
                                const isFromMe = parseInt(message.sender_id) === user.id;

                                return (
                                    <div key={message.id}>
                                        {/* Date separator */}
                                        {showDateSeparator && (
                                            <div className="date-separator">
                                                <span>{formatDate(message.timestamp)}</span>
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div className={`message-bubble ${isFromMe ? 'me' : 'them'}`}>
                                            <p className="message-text">{message.text}</p>
                                            <span className="message-time">
                                                {formatTime(message.timestamp)}
                                                {isFromMe && (
                                                    <span className={`read-status ${message.is_read ? 'read' : 'unread'}`}>
                                                        {message.is_read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form className="message-input-container" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="message-input"
                                disabled={sendingMessage}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!newMessage.trim() || sendingMessage}
                            >
                                {sendingMessage ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="empty-conversation-placeholder">
                        {loading ? (
                            <div className="loading-indicator">Loading messages...</div>
                        ) : (
                            <div className="no-conversation-selected">
                                <div className="empty-icon">💬</div>
                                <h2>Select a conversation</h2>
                                <p>Choose a conversation from the list or start a new one by visiting a product page.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {conversations.length === 0 && !startingNewConversation && !loading && (
                    <div className="empty-state">
                        <div className="empty-icon">💬</div>
                        <h2>No Messages Yet</h2>
                        <p>Your conversations will appear here once you start messaging other users.</p>
                        <Link to="/buyer" className="btn btn-primary">Browse Products</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;