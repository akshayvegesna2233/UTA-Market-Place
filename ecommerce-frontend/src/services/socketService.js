// src/services/socketService.js
import { io } from 'socket.io-client';
import { authService } from './index';

class SocketService {
    constructor() {
        this.socket = null;
        this.socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5555';
    }

    // Initialize socket connection
    connect() {
        if (this.socket) return;

        // Get authentication token
        const token = localStorage.getItem('token');

        // Connect to socket server with auth token
        this.socket = io(this.socketUrl, {
            auth: {
                token
            },
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // Setup event listeners
        this.socket.on('connect', () => {
            console.log('Socket connected');

            // Join user-specific room for private messages
            const user = authService.getUser();
            if (user) {
                this.socket.emit('join', `user-${user.id}`);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        return this.socket;
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Subscribe to an event
    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }

    // Unsubscribe from an event
    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    // Emit an event
    emit(event, data) {
        if (!this.socket) this.connect();
        this.socket.emit(event, data);
    }

    // Join a room (e.g., for conversation)
    joinRoom(room) {
        if (!this.socket) this.connect();
        this.socket.emit('join', room);
    }

    // Leave a room
    leaveRoom(room) {
        if (this.socket) {
            this.socket.emit('leave', room);
        }
    }
}

const socketService = new SocketService();
export default socketService;