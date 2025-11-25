// config/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');
const Message = require('../models/Message');

// Initialize socket.io with a server
const initializeSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User ${socket.user.id} connected`);

        // Join user's personal room for direct messages
        socket.join(`user-${socket.user.id}`);

        // Join conversations
        socket.on('join-conversation', (conversationId) => {
            // Verify user is part of the conversation
            Message.isParticipant(conversationId, socket.user.id)
                .then(isParticipant => {
                    if (isParticipant) {
                        socket.join(`conversation-${conversationId}`);
                        console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
                    } else {
                        socket.emit('error', { message: 'Not authorized to join this conversation' });
                    }
                })
                .catch(error => {
                    console.error('Error joining conversation:', error);
                    socket.emit('error', { message: 'Error joining conversation' });
                });
        });

        // Leave conversation
        socket.on('leave-conversation', (conversationId) => {
            socket.leave(`conversation-${conversationId}`);
            console.log(`User ${socket.user.id} left conversation ${conversationId}`);
        });

        // New message handler
        socket.on('send-message', async (data) => {
            try {
                const { conversationId, text } = data;

                // Verify user is part of the conversation
                const isParticipant = await Message.isParticipant(conversationId, socket.user.id);

                if (!isParticipant) {
                    return socket.emit('error', { message: 'Not authorized to send messages to this conversation' });
                }

                // Save message to database
                const messageId = await Message.sendMessage(conversationId, socket.user.id, text);

                // Get the newly created message
                const [messages] = await pool.execute(
                    `SELECT 
            m.id, m.sender_id, m.text, m.timestamp, m.is_read,
            u.first_name, u.last_name, u.avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?`,
                    [messageId]
                );

                const message = messages[0];

                // Broadcast message to conversation room
                io.to(`conversation-${conversationId}`).emit('new-message', {
                    conversation: conversationId,
                    message
                });

                // Get conversation details to send notifications
                const conversation = await Message.getConversationDetails(conversationId);

                // Send notification to other participants
                conversation.participants.forEach(participant => {
                    if (participant.user_id !== socket.user.id) {
                        io.to(`user-${participant.user_id}`).emit('message-notification', {
                            conversation: conversationId,
                            message,
                            sender: {
                                id: socket.user.id,
                                name: `${message.first_name} ${message.last_name}`
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Mark messages as read
        socket.on('mark-as-read', async (conversationId) => {
            try {
                // Verify user is part of the conversation
                const isParticipant = await Message.isParticipant(conversationId, socket.user.id);

                if (!isParticipant) {
                    return socket.emit('error', { message: 'Not authorized for this conversation' });
                }

                // Mark messages as read
                await Message.markAsRead(conversationId, socket.user.id);

                // Notify other participants that messages were read
                io.to(`conversation-${conversationId}`).emit('messages-read', {
                    conversation: conversationId,
                    userId: socket.user.id
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Error marking messages as read' });
            }
        });

        // Typing indicator
        socket.on('typing', (conversationId) => {
            // Broadcast typing event to conversation
            socket.to(`conversation-${conversationId}`).emit('user-typing', {
                conversation: conversationId,
                user: socket.user.id
            });
        });

        // Stop typing indicator
        socket.on('stop-typing', (conversationId) => {
            // Broadcast stop typing event to conversation
            socket.to(`conversation-${conversationId}`).emit('user-stop-typing', {
                conversation: conversationId,
                user: socket.user.id
            });
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`User ${socket.user.id} disconnected`);
        });
    });

    return io;
};

module.exports = {
    initializeSocket
};