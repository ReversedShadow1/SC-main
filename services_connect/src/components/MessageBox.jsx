import { useState, useEffect, useCallback } from 'react';
import { Box, Fade, IconButton, Paper } from '@mui/material';
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import { io } from 'socket.io-client';
import {
  MessageList,
  Input,
  Button,
} from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import axiosConfig from '../config/axiosConfig';

export default function MessageBox({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sender, setSender] = useState(null);
  const [socket, setSocket] = useState(null);
  const conversationId = 1;

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (!open) {
      setCollapsed(false);
    }
  }, [open]);

  // Fetch user and establish socket connection
  useEffect(() => {
    let isMounted = true;
    let socketInstance = null;

    const fetchUser = async () => {
      try {
        const response = await axiosConfig.get('/user/me');
        if (isMounted) {
          setSender(response.data.id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await axiosConfig.get(`/messages/${conversationId}`);
        const formattedMessages = response.data.map((msg) => ({
          position: msg.senderId === sender ? 'right' : 'left',
          type: 'text',
          text: msg.content,
          date: new Date(msg.createdAt),
        }));
        
        if (isMounted) {
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    const initializeSocket = () => {
      socketInstance = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setSocket(socketInstance);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      socketInstance.on('receiveMessage', (message) => {
        if (message.conversationId === conversationId) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              position: message.senderId === sender ? 'right' : 'left',
              type: 'text',
              text: message.content,
              date: new Date(message.createdAt),
            },
          ]);
        }
      });
    };

    fetchUser();
    fetchMessages();
    initializeSocket();

    return () => {
      isMounted = false;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [conversationId]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      content: newMessage,
      senderId: sender,
      conversationId,
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        position: 'right',
        type: 'text',
        text: newMessage,
        date: new Date(),
      },
    ]);

    setNewMessage('');
  }, [newMessage, sender, socket, conversationId]);

  if (!open) return null;

  return (
    <Box boxShadow={5}>
      <Box
        sx={{
          
          width: 350,
          position: 'fixed',
          bottom: collapsed ? 10 : 400,
          right: 50,
          zIndex: 1001,
          bgcolor: 'blue',
          p: 1,
        }}
      >
        <IconButton onClick={onClose} aria-label="close" size="small">
          <FullscreenExitRoundedIcon />
        </IconButton>
        <IconButton onClick={handleToggle} aria-label="toggle" size="small">
          {collapsed ? <FullscreenExitRoundedIcon /> : <MinimizeRoundedIcon />}
        </IconButton>
      </Box>
      <Fade in={!collapsed} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 50,
            width: 350,
            height: 400,
            bgcolor: 'white',
            p: 1
          }}
        >
          <Box sx={{ width: '100%', height: 350, overflowY: 'scroll',   }}>
            <MessageList
              className="message-list"
              lockable={true}
              toBottomHeight="90%"
              dataSource={messages}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 10, position: 'fixed', bottom: 5, width: 335 }}>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rightButtons={
                  <Button
                    text="Send"
                    onClick={handleSendMessage}
                    title="Send"
                  />
                }
              />
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}