import React, { useState, useEffect } from 'react';

const BearMascot = ({ message, mood = 'happy' }) => {
  const [currentMessage, setCurrentMessage] = useState(message);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setIsVisible(true);
      
      // Auto-hide message after 8 seconds
      const timer = setTimeout(() => setIsVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const mascotExpressions = {
    happy: '🐻',
    excited: '🤗', 
    encouraging: '👏',
    thinking: '🤔',
    celebrating: '🎉'
  };

  const speakMessage = () => {
    if (currentMessage && 'speechSynthesis' in window) {
      speechSynthesis.cancel(); // Stop any current speech
      
      const utterance = new SpeechSynthesisUtterance(currentMessage);
      utterance.rate = 0.8; // Slower for children
      utterance.pitch = 1.2; // Higher pitch
      utterance.volume = 0.8;
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className="bear-mascot">
      {/* Speech Bubble */}
      {currentMessage && isVisible && (
        <div className="speech-bubble">
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
          <p>{currentMessage}</p>
        </div>
      )}
      
      {/* Bear Character */}
      <div 
        className="bear-character"
        onClick={speakMessage}
        title="Click me to hear my message!"
      >
        {mascotExpressions[mood]}
      </div>
    </div>
  );
};

export default BearMascot;
