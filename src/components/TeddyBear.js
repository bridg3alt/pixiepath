import React, { useState, useEffect } from 'react';

const TeddyBear = ({ childName, childAge, onComplete }) => {
  const [message, setMessage] = useState('');
  const [teddyState, setTeddyState] = useState('dancing');

  useEffect(() => {
    setTimeout(() => {
      setMessage(`Hi ${childName}! I'm Teddy, your AI buddy! Ready for fun? 🐻✨`);
      setTeddyState('talking');
    }, 2000);
  }, [childName]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F4FD 0%, #F0F8FF 50%, #E6F3FF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', color: '#6B73FF', marginBottom: '1rem' }}>
          Meet Teddy! 🐻
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#9B59B6' }}>
          Your AI Learning Buddy
        </p>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '30px',
        padding: '3rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        {/* Teddy Bear */}
        <div style={{
          fontSize: '8rem',
          marginBottom: '2rem',
          animation: teddyState === 'dancing' 
            ? 'dance 1s ease-in-out infinite' 
            : teddyState === 'talking'
            ? 'talk 0.6s ease-in-out infinite'
            : 'breathe 3s ease-in-out infinite'
        }}>
          🐻
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: 'rgba(107, 115, 255, 0.1)',
            border: '3px solid #6B73FF',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '2rem',
            fontSize: '1.3rem',
            color: '#2C3E50',
            lineHeight: '1.6'
          }}>
            {message}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => {
              setMessage("Let's dance together! 💃🕺");
              setTeddyState('dancing');
            }}
            style={{
              background: 'linear-gradient(135deg, #FFB347, #FF9500)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💃 Dance Party
          </button>

          <button
            onClick={() => {
              const jokes = [
                "Why don't bears wear shoes? Because they have bear feet! 🐾",
                "What do you call a bear with no teeth? A gummy bear! 🍬"
              ];
              setMessage(jokes[Math.floor(Math.random() * jokes.length)]);
              setTeddyState('talking');
            }}
            style={{
              background: 'linear-gradient(135deg, #52C4B0, #45B7A8)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            😂 Tell Joke
          </button>
        </div>

        <button
          onClick={onComplete}
          style={{
            background: 'linear-gradient(135deg, #6B73FF, #9B59B6)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '1.5rem 3rem',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Ready to Learn! 🚀
        </button>
      </div>

      <style>{`
        @keyframes dance {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-5deg) scale(1.05); }
          50% { transform: rotate(5deg) scale(1.1); }
          75% { transform: rotate(-3deg) scale(1.05); }
        }
        
        @keyframes talk {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default TeddyBear;
