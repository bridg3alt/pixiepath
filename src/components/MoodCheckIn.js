import React, { useState } from 'react';

const MoodCheckIn = ({ onMoodSelect }) => {
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    { emoji: "😊", label: "Happy", description: "I feel like a bright sunny day!" },
    { emoji: "😐", label: "Okay", description: "I feel like a calm lake" },
    { emoji: "😔", label: "Sad", description: "I feel like a rainy cloud" },
    { emoji: "😡", label: "Angry", description: "I feel like a volcano erupting" },
    { emoji: "😴", label: "Tired", description: "I feel like a sleepy cat" }
  ];

  const handleMoodSelect = (mood) => {
    console.log('handleMoodSelect called with:', mood);
    setSelectedMood(mood);
    
    // Check if onMoodSelect function exists and call it
    if (onMoodSelect && typeof onMoodSelect === 'function') {
      setTimeout(() => {
        onMoodSelect(mood);
      }, 800);
    } else {
      console.error('onMoodSelect is not a function:', onMoodSelect);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Animated Background */}
      <div className="animated-background">
        <div className="hill hill-1"></div>
        <div className="hill hill-2"></div>
        <div className="hill hill-3"></div>
        <div className="rainbow"></div>
        <div className="floating-element butterfly-1">🦋</div>
        <div className="floating-element butterfly-2">🦋</div>
        <div className="floating-element tree-1">🌳</div>
        <div className="floating-element tree-2">🌲</div>
        <div className="floating-element cloud-1">☁️</div>
        <div className="floating-element cloud-2">☁️</div>
      </div>

      {/* Content - This should only appear ONCE */}
      <div className="screen-content">
        <h1 className="title-main">How are you feeling today?</h1>
        <p className="subtitle">Choose the emoji that matches your mood! 🐻</p>

        <div className="mood-grid">
          {moods.map((mood, index) => (
            <div
              key={mood.label}
              className={`mood-card ${selectedMood?.label === mood.label ? 'selected' : ''}`}
              onClick={() => handleMoodSelect(mood)}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                animation: 'bounceGentle 2s ease-in-out infinite',
                animationDelay: `${index * 0.2}s`
              }}>
                {mood.emoji}
              </div>
              <h3 style={{ 
                fontFamily: 'Fredoka', 
                fontSize: '1.25rem', 
                color: '#374151',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                {mood.label}
              </h3>
              <p style={{ 
                fontFamily: 'Nunito', 
                fontSize: '0.875rem', 
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                {mood.description}
              </p>
            </div>
          ))}
        </div>

        {selectedMood && (
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              borderRadius: '25px',
              fontFamily: 'Fredoka',
              fontSize: '1.125rem',
              fontWeight: '500',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              Great choice! You're feeling {selectedMood.label} {selectedMood.emoji}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodCheckIn;
