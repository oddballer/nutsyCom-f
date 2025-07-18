import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { Button, TextInput, ScrollView, WindowContent, Window, WindowHeader, List, Fieldset, Radio } from 'react95';

// Use environment variable for backend URL, fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
// Ensure no trailing slash for proper URL construction
const BACKEND_URL = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
const ROOM_ID = 1; // General room

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [authError, setAuthError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const imrcvRef = useRef(null);
  const imsendRef = useRef(null);
  const talkbegRef = useRef(null);
  const talkendRef = useRef(null);
  const { user, token } = useAuth();
  const [inCall, setInCall] = useState(false);
  // WebRTC state
  const [callUsers, setCallUsers] = useState([]); // userIds in call (excluding self)
  const [peerConnections, setPeerConnections] = useState({}); // userId -> RTCPeerConnection
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream
  const [localStream, setLocalStream] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');

  // --- WebRTC: Helper to add a peer connection ---
  const addPeerConnection = (userId, isInitiator) => {
    if (peerConnections[userId]) return; // Already connected
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    });
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-signal', {
          roomId: ROOM_ID,
          targetUserId: userId,
          signalData: { type: 'ice-candidate', candidate: event.candidate }
        });
      }
    };
    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };
    // Store connection
    setPeerConnections(prev => ({ ...prev, [userId]: pc }));
    // If initiator, create offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            socketRef.current.emit('webrtc-signal', {
              roomId: ROOM_ID,
              targetUserId: userId,
              signalData: { type: 'offer', sdp: offer }
            });
          }
        } catch (err) { /* handle error */ }
      };
    }
  };

  // --- Join Call Handler ---
  const handleJoinCall = async () => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setInCall(true);
      if (socketRef.current) {
        socketRef.current.emit('webrtc-join', ROOM_ID);
      }
      // Play join call sound
      if (talkbegRef.current) {
        talkbegRef.current.currentTime = 0;
        talkbegRef.current.play();
      }
    } catch (err) {
      // handle error (mic denied, etc)
    }
  };

  // --- Leave Call Handler ---
  const handleLeaveCall = () => {
    // Play leave call sound
    if (talkendRef.current) {
      talkendRef.current.currentTime = 0;
      talkendRef.current.play();
    }
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    setPeerConnections({});
    setRemoteStreams({});
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setInCall(false);
    // setCallUsers([]); // Removed: let signaling events manage callUsers
    if (socketRef.current) {
      socketRef.current.emit('webrtc-leave', ROOM_ID);
    }
  };

  // --- WebRTC signaling listeners ---
  useEffect(() => {
    if (!socketRef.current) return;
    // User joined call
    socketRef.current.on('webrtc-user-joined', ({ userId }) => {
      if (userId === user.id) return;
      setCallUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      // Initiate connection as the responder (not initiator)
      addPeerConnection(userId, false);
    });
    // User left call
    socketRef.current.on('webrtc-user-left', ({ userId }) => {
      setCallUsers(prev => prev.filter(id => id !== userId));
      if (peerConnections[userId]) {
        peerConnections[userId].close();
        setPeerConnections(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });
    // WebRTC signaling
    socketRef.current.on('webrtc-signal', async ({ fromUserId, signalData }) => {
      let pc = peerConnections[fromUserId];
      if (!pc) {
        // If no connection, create as responder
        addPeerConnection(fromUserId, false);
        pc = peerConnections[fromUserId];
      }
      if (!pc) return;
      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            roomId: ROOM_ID,
            targetUserId: fromUserId,
            signalData: { type: 'answer', sdp: answer }
          });
        }
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
      } else if (signalData.type === 'ice-candidate' && signalData.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (e) { /* ignore */ }
      }
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.off('webrtc-user-joined');
        socketRef.current.off('webrtc-user-left');
        socketRef.current.off('webrtc-signal');
      }
    };
  }, [peerConnections, localStream, user.id]);

  // --- When inCall, announce to others and connect to existing users ---
  useEffect(() => {
    if (!inCall || !socketRef.current) return;
    // On join, ask backend for current call users (not implemented yet, so rely on join/leave events)
    // For now, connect to all users in onlineUsers except self
    onlineUsers.forEach(u => {
      if (u.id !== user.id && !peerConnections[u.id]) {
        addPeerConnection(u.id, true); // Initiator for existing users
      }
    });
  }, [inCall, onlineUsers, peerConnections, user.id, localStream]);

  // Ensure localStream tracks are added to all peer connections
  useEffect(() => {
    if (!localStream) return;
    Object.values(peerConnections).forEach(pc => {
      localStream.getTracks().forEach(track => {
        // Only add if not already added
        if (!pc.getSenders().some(sender => sender.track && sender.track.id === track.id)) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream, peerConnections]);

  // Fetch device list when modal opens
  useEffect(() => {
    if (!settingsOpen) return;
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
      setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
    });
  }, [settingsOpen]);

  const handleSettings = () => {
    setSettingsOpen(true);
  };
  const handleSettingsOk = () => {
    setSettingsOpen(false);
    // TODO: Apply selectedInput/selectedOutput to WebRTC logic
  };
  const handleSettingsCancel = () => {
    setSettingsOpen(false);
  };

  useEffect(() => {
    if (!user || !token) {
      setConnectionStatus('Not authenticated');
      return;
    }

    // Connect to socket.io server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setConnectionStatus('Connected');
      // Authenticate the socket connection
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      setConnectionStatus('Authenticated');
      // Join room after authentication
      socket.emit('joinRoom', ROOM_ID);
    });

    socket.on('authError', (error) => {
      setAuthError(error.message);
      setConnectionStatus('Authentication failed');
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('Connection failed');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected');
    });

    socket.on('roomJoined', (data) => {
      setConnectionStatus('In chat room');
    });

    // Fetch chat history
    const apiUrl = `${BACKEND_URL}/api/rooms/${ROOM_ID}/messages`;
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMessages(data);
      })
      .catch(err => {
        setConnectionStatus('API Error');
      });

    // Listen for new messages
    socket.on('chatMessage', (msg) => {
      setMessages(prev => {
        // Play sound if message is from another user
        if ((msg.user_id !== user.id && msg.id !== user.id) && imrcvRef.current) {
          imrcvRef.current.currentTime = 0;
          imrcvRef.current.play();
        }
        return [...prev, msg];
      });
    });

    // Listen for chat errors
    socket.on('chatError', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Listen for general errors
    socket.on('error', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Listen for online users
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('webrtc-user-joined');
        socketRef.current.off('webrtc-user-left');
      }
      socket.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    try {
      const msg = { roomId: ROOM_ID, content: chatInput };
      socketRef.current.emit('chatMessage', msg);
      setChatInput('');
      if (imsendRef.current) {
        imsendRef.current.currentTime = 0;
        imsendRef.current.play();
      }
    } catch (error) {
      setConnectionStatus('Send Error');
    }
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 20,
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 16, fontSize: '14px' }}>
          Please log in to access the chat.
        </div>
      </div>
    );
  }

  return (
    <>
      <audio ref={imrcvRef} src="/imrcv.wav" preload="auto" />
      <audio ref={imsendRef} src="/imsend.wav" preload="auto" />
      {/* Play on join call */}
      <audio ref={talkbegRef} src="/talkbeg.wav" preload="auto" />
      {/* Play on leave call */}
      <audio ref={talkendRef} src="/talkend.wav" preload="auto" />
      {/* Render local stream audio (muted) */}
      {localStream && <audio autoPlay muted ref={el => { if (el) el.srcObject = localStream; }} style={{ display: 'none' }} />}
      {/* Render remote streams */}
      {Object.entries(remoteStreams).map(([uid, stream]) => (
        <audio key={uid} autoPlay ref={el => { if (el) el.srcObject = stream; }} style={{ display: 'none' }} />
      ))}
      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1000, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Window style={{ minWidth: 320, maxWidth: 400 }}>
            <WindowHeader>Call Settings</WindowHeader>
            <WindowContent>
              <Fieldset label="Audio Input">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Radio
                    checked={selectedInput === ''}
                    onChange={() => setSelectedInput('')}
                    value=""
                    style={{ marginBottom: 2 }}
                  >
                    Default
                  </Radio>
                  {audioInputs.map(d => (
                    <Radio
                      key={d.deviceId}
                      checked={selectedInput === d.deviceId}
                      onChange={() => setSelectedInput(d.deviceId)}
                      value={d.deviceId}
                      style={{ marginBottom: 2 }}
                    >
                      {d.label || `Microphone (${d.deviceId})`}
                    </Radio>
                  ))}
                </div>
              </Fieldset>
              <Fieldset label="Audio Output" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Radio
                    checked={selectedOutput === ''}
                    onChange={() => setSelectedOutput('')}
                    value=""
                    style={{ marginBottom: 2 }}
                  >
                    Default
                  </Radio>
                  {audioOutputs.map(d => (
                    <Radio
                      key={d.deviceId}
                      checked={selectedOutput === d.deviceId}
                      onChange={() => setSelectedOutput(d.deviceId)}
                      value={d.deviceId}
                      style={{ marginBottom: 2 }}
                    >
                      {d.label || `Speaker (${d.deviceId})`}
                    </Radio>
                  ))}
                </div>
              </Fieldset>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button onClick={handleSettingsOk}>OK</Button>
                <Button onClick={handleSettingsCancel}>Cancel</Button>
              </div>
            </WindowContent>
          </Window>
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', height: '100%' }}>
        {/* Online users sidebar */}
        <div style={{
          width: 140,
          minWidth: 140,
          background: 'transparent',
          borderRight: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: 4, alignSelf: 'center' }}>
            Online Users
          </div>
          <ScrollView style={{ flex: 1, minHeight: 0, background: '#ffffff', border: 'none', padding: 0, margin: 0 }}>
            <div style={{ textAlign: 'center' }}>
              {onlineUsers.map(u => {
                const isCurrentUser = u.id === user.id;
                const isInCall = isCurrentUser ? inCall : callUsers.includes(u.id);
                return (
                  <span key={u.id} style={{ display: 'block', padding: '2px 0', alignSelf: 'center', fontWeight: 'bold', fontSize: '12px', color: isCurrentUser ? 'blue' : 'red' }}>
                    {u.display_name} {isInCall && <span role="img" aria-label="In Call">📞</span>}
                  </span>
                );
              })}
            </div>
          </ScrollView>
          {/* VOIP Button Row */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 8, margin: '8px 0' }}>
            {!inCall && (
              <Button
                size="sm"
                onClick={handleJoinCall}
                style={{ minWidth: 36, minHeight: 36 }}
                title="Join Call"
              >
                <span role="img" aria-label="Join Call">📞</span>
              </Button>
            )}
            {inCall && (
              <Button
                size="sm"
                onClick={handleLeaveCall}
                style={{ minWidth: 36, minHeight: 36 }}
                title="Leave Call"
              >
                <span role="img" aria-label="Leave Call">❌</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSettings}
              style={{ minWidth: 36, minHeight: 36 }}
              title="Settings"
            >
              <span role="img" aria-label="Settings">⚙️</span>
            </Button>
          </div>
        </div>
        {/* Chat area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
          padding: 0
        }}>
          <ScrollView className="chat-messages-scroll" style={{ flex: 1, background: '#ffffff', border: '1px solid #ccc', padding: 8, minHeight: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <div>
              {messages.map((msg, idx) => {
                const isCurrentUser = msg.user_id === user.id || msg.id === user.id;
                return (
                  <span key={idx} style={{ display: 'block', marginBottom: 2, padding: '2px 0', fontWeight: 'bold', color: isCurrentUser ? 'blue' : 'red', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {msg.display_name || msg.username || `User ${msg.user_id}`}
                    <span style={{ fontWeight: 'normal', color: '#000', marginLeft: 4 }}>:{' '}{msg.content}</span>
                  </span>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollView>
          <form onSubmit={sendMessage} style={{
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            minHeight: 40,
            marginTop: 8
          }}>
            <TextInput
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
              placeholder="Type a message..."
              disabled={!user || connectionStatus !== 'In chat room'}
              fullWidth
              background="#add6cb"
            />
            <Button
              type="submit"
              style={{ minWidth: 60, flexShrink: 0, marginRight: 4 }}
              disabled={!user || connectionStatus !== 'In chat room'}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChatApp;