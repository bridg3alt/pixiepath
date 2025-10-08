import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Ready to test Firebase...');
  const [user, setUser] = useState(null);

  const testFirebaseAuth = async () => {
    try {
      setStatus('🔄 Testing Firebase Authentication...');
      
      const result = await signInAnonymously(auth);
      setUser(result.user);
      setStatus(`✅ Firebase Auth Success! User ID: ${result.user.uid}`);
      
      // Test Firestore
      await addDoc(collection(db, 'test'), {
        message: 'Hello PixiePath!',
        timestamp: new Date()
      });
      
      setStatus(`✅ Firebase Auth & Firestore both working! 🎉`);
      
    } catch (error) {
      setStatus(`❌ Firebase Error: ${error.message}`);
      console.error('Firebase error:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#7C3AED', fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
        🐻 PixiePath
      </h1>
      <h2 style={{ color: '#7C3AED', fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        🔥 Firebase Connection Test
      </h2>
      
      <div style={{ 
        background: '#f3f4f6', 
        padding: '1rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        fontFamily: 'monospace',
        fontSize: '1rem',
        border: '2px solid #e5e7eb'
      }}>
        {status}
      </div>
      
      {user && (
        <div style={{ 
          background: '#d1fae5', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          border: '2px solid #10b981'
        }}>
          <strong>🎉 User authenticated successfully!</strong><br/>
          <strong>UID:</strong> {user.uid}<br/>
          <strong>Anonymous:</strong> {user.isAnonymous ? 'Yes' : 'No'}
        </div>
      )}
      
      <button
        onClick={testFirebaseAuth}
        style={{
          background: 'linear-gradient(to right, #7C3AED, #EC4899)',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '12px',
          fontSize: '1.2rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        🔥 Test Firebase Connection
      </button>
      
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
        <p>Step 1: Testing Firebase Authentication & Database</p>
        <p>Once this works, we'll add the beautiful UI! ✨</p>
      </div>
    </div>
  );
};

export default FirebaseTest;
