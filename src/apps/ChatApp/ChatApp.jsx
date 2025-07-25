import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { Button, TextInput, ScrollView, WindowContent, Window, WindowHeader, GroupBox, Select } from 'react95';

// Use environment variable for backend URL, fallback to Heroku for production
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://nutsy-backend-197d2c7f6689.herokuapp.com';
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
  const [selectedInput, setSelectedInput] = useState('mic-default');
  const [selectedOutput, setSelectedOutput] = useState('spk-default');
  // Track previous device selections for reconnect logic
  const [prevInput, setPrevInput] = useState('mic-default');
  const [prevOutput, setPrevOutput] = useState('spk-default');
  // Queue for ICE candidates that arrive before remote description is set
  const [iceCandidateQueue, setIceCandidateQueue] = useState({}); // userId -> [candidates]

  // --- WebRTC: Helper to add a peer connection ---
  const addPeerConnection = (userId, isInitiator) => {
    if (peerConnections[userId]) {
      console.log(`Peer connection already exists for user ${userId}`);
      return; // Already connected
    }
    
    console.log(`Creating peer connection for user ${userId}, initiator: ${isInitiator}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });
    
    // Add local stream tracks
    if (localStream) {
      console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection`);
      localStream.getTracks().forEach(track => {
        console.log(`Adding track: ${track.kind}, enabled: ${track.enabled}`);
        pc.addTrack(track, localStream);
      });
    } else {
      console.warn('No local stream available when creating peer connection');
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`Sending ICE candidate to user ${userId}:`, event.candidate);
        socketRef.current.emit('webrtc-signal', {
          roomId: ROOM_ID,
          targetUserId: userId,
          signalData: { type: 'ice-candidate', candidate: event.candidate }
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state for user ${userId}: ${pc.connectionState}`);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for user ${userId}: ${pc.iceConnectionState}`);
    };
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`Received remote stream from user ${userId}:`, event.streams[0]);
      console.log(`Track details:`, event.track);
      console.log(`Stream tracks:`, event.streams[0].getTracks());
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };
    
    // Store connection
    setPeerConnections(prev => ({ ...prev, [userId]: pc }));
    
    // If initiator, create offer
    if (isInitiator) {
      console.log(`Setting up negotiation needed handler for user ${userId}`);
      pc.onnegotiationneeded = async () => {
        console.log(`Negotiation needed for user ${userId}`);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`Sending offer to user ${userId}:`, offer);
          if (socketRef.current) {
            socketRef.current.emit('webrtc-signal', {
              roomId: ROOM_ID,
              targetUserId: userId,
              signalData: { type: 'offer', sdp: offer }
            });
          }
        } catch (err) { 
          console.error(`Error creating offer for user ${userId}:`, err);
        }
      };
      
      // Trigger negotiation if we already have tracks
      if (localStream && localStream.getTracks().length > 0) {
        console.log(`Triggering negotiation for user ${userId} (has tracks)`);
        setTimeout(() => {
          if (pc.connectionState !== 'closed') {
            pc.onnegotiationneeded();
          }
        }, 100);
      }
    }
  };

  // --- Join Call Handler ---
  const handleJoinCall = async () => {
    try {
      console.log('Frontend: handleJoinCall called');
      console.log('Current socket state:', {
        socketRef: !!socketRef.current,
        socketConnected: socketRef.current?.connected,
        socketId: socketRef.current?.id,
        connectionStatus
      });
      // Get local media with selected input device
      let constraints = { audio: true };
      if (selectedInput && selectedInput !== 'mic-default') {
        const deviceId = selectedInput.replace('mic-', '');
        constraints = { audio: { deviceId: { exact: deviceId } } };
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local stream:', stream);
      setLocalStream(stream);
      console.log('Setting inCall to true');
      setInCall(true);
      if (socketRef.current && socketRef.current.connected) {
        console.log(`Frontend: Emitting webrtc-join for room ${ROOM_ID} on socket ${socketRef.current.id}`);
        socketRef.current.emit('webrtc-join', ROOM_ID);
      } else {
        console.error('Frontend: socketRef.current is null or not connected!', {
          socketRef: !!socketRef.current,
          connected: socketRef.current?.connected,
          socketId: socketRef.current?.id
        });
      }
      // Play join call sound
      if (talkbegRef.current) {
        talkbegRef.current.currentTime = 0;
        talkbegRef.current.play();
      }
    } catch (err) {
      console.error('Frontend: Error joining call:', err);
      // handle error (mic denied, etc)
    }
  };

  // --- Leave Call Handler ---
  const handleLeaveCall = () => {
    console.log('Frontend: handleLeaveCall called');
    // Play leave call sound
    if (talkendRef.current) {
      talkendRef.current.currentTime = 0;
      talkendRef.current.play();
    }
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    setPeerConnections({});
    setRemoteStreams({});
    // Clear ICE candidate queue
    setIceCandidateQueue({});
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setInCall(false);
    // setCallUsers([]); // Removed: let signaling events manage callUsers
    if (socketRef.current) {
      console.log(`Frontend: Emitting webrtc-leave for room ${ROOM_ID}`);
      socketRef.current.emit('webrtc-leave', ROOM_ID);
    }
  };

  // --- WebRTC signaling listeners ---
  useEffect(() => {
    if (!socketRef.current) return;
    // This useEffect is now only for cleanup and re-initialization when dependencies change
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
    console.log('inCall effect triggered, connecting to existing users:', onlineUsers);
    // On join, ask backend for current call users (not implemented yet, so rely on join/leave events)
    // For now, connect to all users in onlineUsers except self
    onlineUsers.forEach(u => {
      if (u.id !== user.id && !peerConnections[u.id]) {
        console.log(`Creating peer connection to existing user ${u.username} (${u.id}) as initiator`);
        addPeerConnection(u.id, true); // Initiator for existing users
      }
    });
  }, [inCall, onlineUsers, peerConnections, user.id, localStream]);

  // --- Rejoin call if socket reconnects while in call ---
  useEffect(() => {
    if (inCall && socketRef.current && socketRef.current.connected && connectionStatus === 'In chat room') {
      console.log('User is in call and socket is connected, ensuring call membership');
      socketRef.current.emit('webrtc-join', ROOM_ID);
    }
  }, [inCall, connectionStatus]);

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
    let tempStream = null;
    (async () => {
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        // User denied or no mic, still try to enumerate
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
      setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
    })();
  }, [settingsOpen]);

  // --- Apply output device to audio elements ---
  useEffect(() => {
    if (selectedOutput && selectedOutput !== 'spk-default') {
      const deviceId = selectedOutput.replace('spk-', '');
      // Set sinkId for all remote audio elements
      Object.entries(remoteStreams).forEach(([uid, stream]) => {
        const audioEl = document.querySelector(`audio[data-uid="${uid}"]`);
        if (audioEl && audioEl.sinkId !== deviceId && audioEl.setSinkId) {
          audioEl.setSinkId(deviceId).catch(() => {});
        }
      });
    }
  }, [selectedOutput, remoteStreams]);

  const handleSettings = () => {
    setSettingsOpen(true);
  };
  // --- Settings OK Handler ---
  const handleSettingsOk = () => {
    setSettingsOpen(false);
    // Save to localStorage
    localStorage.setItem('voiceInputDevice', selectedInput);
    localStorage.setItem('voiceOutputDevice', selectedOutput);
    // If device selection changed and in call, reconnect
    if ((selectedInput !== prevInput || selectedOutput !== prevOutput) && inCall) {
      handleLeaveCall();
      setTimeout(() => {
        handleJoinCall();
      }, 500); // Give time for cleanup
    }
    setPrevInput(selectedInput);
    setPrevOutput(selectedOutput);
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
    console.log('Attempting to connect to:', SOCKET_URL);
    console.log('Current window location:', window.location.origin);
    
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: false, // Disable credentials for cross-origin
    });
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully!');
      console.log('Socket ID:', socket.id);
      setConnectionStatus('Connected');
      // Authenticate the socket connection
      console.log('Authenticating with token:', token ? 'Token exists' : 'No token');
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      console.log('Socket authenticated successfully:', data);
      setConnectionStatus('Authenticated');
      // Join room after authentication
      console.log('Joining room:', ROOM_ID);
      socket.emit('joinRoom', ROOM_ID);
    });

    socket.on('authError', (error) => {
      setAuthError(error.message);
      setConnectionStatus('Authentication failed');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      setConnectionStatus(`Reconnecting... (${attemptNumber})`);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setConnectionStatus('Reconnection failed');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected on attempt ${attemptNumber}`);
      setConnectionStatus('Reconnected');
      // If user was in call, rejoin the call
      if (inCall && socketRef.current) {
        console.log('Rejoining call after reconnection');
        socketRef.current.emit('webrtc-join', ROOM_ID);
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected');
    });

    socket.on('roomJoined', (data) => {
      console.log('Successfully joined room:', data);
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
      console.log('Frontend: Received onlineUsers:', users);
      setOnlineUsers(users);
    });

    // Listen for call started event (when first user joins)
    socket.on('call-started', ({ roomId, callMembers }) => {
      console.log('Frontend: Received call-started event:', { roomId, callMembers });
      // Update callUsers with the current call members
      setCallUsers(callMembers.filter(id => id !== user.id));
    });

    // --- WebRTC Signaling Listeners ---
    // User joined call
    socket.on('webrtc-user-joined', ({ userId }) => {
      console.log(`Frontend: Received webrtc-user-joined for user ${userId}, current user: ${user.id}`);
      console.log(`Current callUsers before update:`, callUsers);
      if (userId === user.id) {
        console.log('Ignoring own join event');
        return;
      }
      setCallUsers(prev => {
        const newCallUsers = prev.includes(userId) ? prev : [...prev, userId];
        console.log(`Updated callUsers:`, newCallUsers);
        return newCallUsers;
      });
      // Initiate connection as the responder (not initiator)
      console.log(`Adding peer connection for user ${userId} as responder`);
      addPeerConnection(userId, false);
    });
    
    // User left call
    socket.on('webrtc-user-left', ({ userId }) => {
      console.log(`Frontend: Received webrtc-user-left for user ${userId}`);
      setCallUsers(prev => {
        const newCallUsers = prev.filter(id => id !== userId);
        console.log(`Updated callUsers after leave:`, newCallUsers);
        return newCallUsers;
      });
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
      // Clear ICE candidate queue for this user
      setIceCandidateQueue(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });
    
    // WebRTC signaling
    socket.on('webrtc-signal', async ({ fromUserId, signalData }) => {
      console.log(`Frontend: Received webrtc-signal from user ${fromUserId}:`, signalData.type);
      
      let pc = peerConnections[fromUserId];
      if (!pc) {
        console.log(`No peer connection for user ${fromUserId}, creating as responder`);
        // If no connection, create as responder
        addPeerConnection(fromUserId, false);
        pc = peerConnections[fromUserId];
      }
      if (!pc) {
        console.error(`Failed to create peer connection for user ${fromUserId}`);
        return;
      }
      
      try {
        if (signalData.type === 'offer') {
          console.log(`Processing offer from user ${fromUserId}`);
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          
          // Process any queued ICE candidates
          const queuedCandidates = iceCandidateQueue[fromUserId] || [];
          if (queuedCandidates.length > 0) {
            console.log(`Processing ${queuedCandidates.length} queued ICE candidates for user ${fromUserId}`);
            for (const candidate of queuedCandidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error(`Error adding queued ICE candidate from user ${fromUserId}:`, e);
              }
            }
            // Clear the queue
            setIceCandidateQueue(prev => {
              const newQueue = { ...prev };
              delete newQueue[fromUserId];
              return newQueue;
            });
          }
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log(`Sending answer to user ${fromUserId}:`, answer);
          if (socketRef.current) {
            socketRef.current.emit('webrtc-signal', {
              roomId: ROOM_ID,
              targetUserId: fromUserId,
              signalData: { type: 'answer', sdp: answer }
            });
          }
        } else if (signalData.type === 'answer') {
          console.log(`Processing answer from user ${fromUserId}`);
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          
          // Process any queued ICE candidates
          const queuedCandidates = iceCandidateQueue[fromUserId] || [];
          if (queuedCandidates.length > 0) {
            console.log(`Processing ${queuedCandidates.length} queued ICE candidates for user ${fromUserId}`);
            for (const candidate of queuedCandidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error(`Error adding queued ICE candidate from user ${fromUserId}:`, e);
              }
            }
            // Clear the queue
            setIceCandidateQueue(prev => {
              const newQueue = { ...prev };
              delete newQueue[fromUserId];
              return newQueue;
            });
          }
        } else if (signalData.type === 'ice-candidate' && signalData.candidate) {
          console.log(`Processing ICE candidate from user ${fromUserId}`);
          try {
            // Check if remote description is set
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
              // Queue the candidate for later
              console.log(`Queuing ICE candidate from user ${fromUserId} - no remote description yet`);
              setIceCandidateQueue(prev => ({
                ...prev,
                [fromUserId]: [...(prev[fromUserId] || []), signalData.candidate]
              }));
            }
          } catch (e) { 
            console.error(`Error adding ICE candidate from user ${fromUserId}:`, e);
          }
        }
      } catch (error) {
        console.error(`Error processing ${signalData.type} from user ${fromUserId}:`, error);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('webrtc-user-joined');
        socketRef.current.off('webrtc-user-left');
        socketRef.current.off('webrtc-signal');
      }
      socket.disconnect();
    };
  }, [user, token, peerConnections, localStream]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const savedInput = localStorage.getItem('voiceInputDevice');
    const savedOutput = localStorage.getItem('voiceOutputDevice');
    if (savedInput) setSelectedInput(savedInput);
    if (savedOutput) setSelectedOutput(savedOutput);
    setPrevInput(savedInput || 'mic-default');
    setPrevOutput(savedOutput || 'spk-default');
  }, []);

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
      {localStream && (
        <audio autoPlay muted ref={el => { if (el) el.srcObject = localStream; }} style={{ display: 'none' }} />
      )}
      {/* Render remote streams */}
      {Object.entries(remoteStreams).map(([uid, stream]) => {
        console.log(`Rendering audio element for user ${uid} with stream:`, stream);
        return (
          <audio
            key={uid}
            data-uid={uid}
            autoPlay
            ref={el => { 
              if (el) {
                console.log(`Setting srcObject for user ${uid}`);
                el.srcObject = stream;
                el.onloadedmetadata = () => console.log(`Audio metadata loaded for user ${uid}`);
                el.oncanplay = () => console.log(`Audio can play for user ${uid}`);
                el.onerror = (e) => console.error(`Audio error for user ${uid}:`, e);
              }
            }}
            style={{ display: 'none' }}
          />
        );
      })}
      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Window style={{ minWidth: 320, maxWidth: 400 }}>
            <WindowHeader>Call Settings</WindowHeader>
            <WindowContent>
              {/* Audio Input Group */}
              <GroupBox label="Audio Input" style={{ marginBottom: 16 }}>
                <Select
                  options={[
                    { value: 'mic-default', label: 'Default' },
                    ...audioInputs.map(d => ({
                      value: `mic-${d.deviceId}`,
                      label: d.label || `Microphone (${d.deviceId})`
                    }))
                  ]}
                  width={220}
                  menuMaxHeight={160}
                  value={selectedInput}
                  onChange={option => setSelectedInput(option.value)}
                />
              </GroupBox>
              {/* Audio Output Group */}
              <GroupBox label="Audio Output" style={{ marginBottom: 16 }}>
                <Select
                  options={[
                    { value: 'spk-default', label: 'Default' },
                    ...audioOutputs.map(d => ({
                      value: `spk-${d.deviceId}`,
                      label: d.label || `Speaker (${d.deviceId})`
                    }))
                  ]}
                  width={220}
                  menuMaxHeight={160}
                  value={selectedOutput}
                  onChange={option => setSelectedOutput(option.value)}
                />
              </GroupBox>
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
                console.log(`Rendering user ${u.display_name}: isCurrentUser=${isCurrentUser}, isInCall=${isInCall}, callUsers=`, callUsers);
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
                onClick={() => {
                  console.log('Call button clicked!');
                  handleJoinCall();
                }}
                style={{ minWidth: 36, minHeight: 36 }}
                title="Join Call"
              >
                <span role="img" aria-label="Join Call">📞</span>
              </Button>
            )}
            {inCall && (
              <Button
                size="sm"
                onClick={() => {
                  console.log('Leave call button clicked!');
                  handleLeaveCall();
                }}
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