import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

const DailyMonitoringGames = ({ user, childData, onComplete, onBack }) => {
  const [currentGame, setCurrentGame] = useState(0);
  const [gameResults, setGameResults] = useState({});
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameData, setGameData] = useState({
    focus: { score: 0, reactions: [], averageTime: 0, accuracy: 0 },
    energy: { score: 0, danceAccuracy: 0, rhythm: 0, movementIntensity: 0 },
    memory: { score: 0, correctRecalls: 0, totalAttempts: 0, patterns: [] }
  });

  const colors = {
    primary: '#FF69B4',
    secondary: '#FFB6C1',
    accent: '#FF1493',
    success: '#98FB98',
    warning: '#FFD700',
    background: 'linear-gradient(135deg, #FFE4E1 0%, #FFF0F5 50%, #E6E6FA 100%)',
    text: '#2D3748',
    energy: '#FF6B35',
    focus: '#4ECDC4',
    memory: '#45B7D1'
  };

  const playSound = (frequency, duration = 200, type = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('🔇 Audio not available, continuing silently');
    }
  };

  const games = [
    {
      id: 'focus',
      title: 'Lightning Star Catcher! ⚡⭐',
      description: 'Catch the magical twinkling stars super fast!',
      component: FocusCatchGame,
      color: colors.focus,
      icon: '⭐',
      duration: 60
    },
    {
      id: 'energy',
      title: 'Dance Battle with Teddy! 💃🐻',
      description: 'Show your best moves and dance with Pink Teddy!',
      component: EnergyDanceGame,
      color: colors.energy,
      icon: '💃',
      duration: 90
    },
    {
      id: 'memory',
      title: 'Treasure Hunt Memory Quest! 🗺️✨',
      description: 'Remember where all the magical treasures are hidden!',
      component: MemoryRecallGame,
      color: colors.memory,
      icon: '🧸',
      duration: 75
    }
  ];

  // FIXED: Individual game start - doesn't auto-advance
  const startGame = (gameIndex) => {
    console.log('🎮 Starting game:', games[gameIndex].title);
    setCurrentGame(gameIndex);
    setGameStartTime(Date.now());
    setIsGameActive(true);
    playSound(660, 300, 'triangle');
  };

  // FIXED: Game completion - returns to selection screen instead of auto-advancing
  const completeGame = (gameId, results) => {
    console.log('🎮 Game completed:', gameId, results);
    
    setGameData(prev => ({
      ...prev,
      [gameId]: results
    }));
    
    setGameResults(prev => ({
      ...prev,
      [gameId]: results
    }));
    
    playSound(880, 500, 'sine');
    
    // FIXED: Don't auto-advance, just return to selection
    setIsGameActive(false);
  };

  // Check if a specific game is completed
  const isGameCompleted = (gameIndex) => {
    const gameId = games[gameIndex].id;
    return gameResults[gameId] && gameResults[gameId].score !== undefined;
  };

  // Get number of completed games
  const getCompletedCount = () => {
    return Object.keys(gameResults).length;
  };

  // Complete all games when user chooses to finish
  const completeAllGames = async () => {
    console.log('🎮 Completing all games with data:', gameData);
    
    const today = new Date().toDateString();
    const timestamp = new Date();
    
    const behavioralScores = {
      focus: calculateAdvancedFocusScore(),
      energy: calculateAdvancedEnergyScore(),
      memory: calculateAdvancedMemoryScore()
    };

    console.log('📊 Calculated behavioral scores:', behavioralScores);

    const testResults = {
      date: today,
      timestamp,
      childId: user.uid,
      childName: childData.name || user.profile?.name || user.displayName || 'Child',
      childAge: childData.age || user.profile?.age || 6,
      rawResults: gameData,
      behavioralScores,
      sessionDuration: Date.now() - gameStartTime,
      gameCompletionOrder: games.map(g => g.id),
      recommendations: generateRecommendations(behavioralScores),
      version: '3.0-fixed'
    };

    try {
      const docId = `${user.uid}_${timestamp.getTime()}`;
      console.log('💾 Saving to Firebase with ID:', docId);
      
      await setDoc(doc(db, 'dailyTests', docId), testResults);
      console.log('✅ Saved to dailyTests collection');
      
      const userUpdateData = {
        'progress.totalGems': increment(15),
        'progress.dailyTestsCompleted': increment(1),
        'progress.sessionsCompleted': increment(1),
        'progress.totalTimeSpent': increment(Math.round((Date.now() - gameStartTime) / 1000)),
        'progress.lastSessionScore': {
          focus: behavioralScores.focus.overall,
          energy: behavioralScores.energy.overall,
          memory: behavioralScores.memory.overall,
          timestamp: timestamp,
          sessionId: docId,
          date: today
        },
        lastActiveDate: timestamp,
        userType: 'child',
        latestAssessment: {
          date: today,
          scores: behavioralScores,
          recommendations: generateRecommendations(behavioralScores),
          sessionDuration: Date.now() - gameStartTime,
          timestamp: timestamp
        },
        'profile.name': childData.name || user.profile?.name || user.displayName || 'Child'
      };
      
      console.log('💾 Updating user progress:', userUpdateData);
      await updateDoc(doc(db, 'users', user.uid), userUpdateData);
      console.log('✅ Updated user progress');
      
      playSound(1320, 800, 'sine');
      onComplete(testResults);
    } catch (error) {
      console.error('❌ Error saving results:', error);
      onComplete(testResults);
    }
  };

  const calculateAdvancedFocusScore = () => {
    const { reactions, averageTime } = gameData.focus;
    if (!reactions || reactions.length === 0) return { overall: 5, breakdown: {} };
    
    const accuracy = reactions.filter(r => r.correct).length / reactions.length;
    const speedScore = Math.max(0, 10 - (averageTime / 200));
    
    return {
      overall: Math.round((accuracy * 5 + speedScore * 5) / 10),
      breakdown: {
        accuracy: Math.round(accuracy * 100),
        speed: Math.round(speedScore),
        sustained_attention: reactions.length >= 15 ? 10 : (reactions.length / 15) * 10
      },
      averageReactionTime: averageTime,
      totalTargets: reactions.length
    };
  };

  const calculateAdvancedEnergyScore = () => {
    const { danceAccuracy = 5, rhythm = 5, movementIntensity = 5 } = gameData.energy;
    
    return {
      overall: Math.round((danceAccuracy + rhythm + movementIntensity) / 3),
      breakdown: {
        coordination: danceAccuracy,
        rhythm_sense: rhythm,
        physical_activity: movementIntensity,
        engagement: Math.min(10, (danceAccuracy + rhythm) / 2)
      }
    };
  };

  const calculateAdvancedMemoryScore = () => {
    const { correctRecalls = 0, totalAttempts = 0, patterns = [] } = gameData.memory;
    if (totalAttempts === 0) return { overall: 5, breakdown: {} };
    
    const accuracy = (correctRecalls / totalAttempts);
    
    return {
      overall: Math.round(accuracy * 10),
      breakdown: {
        accuracy: Math.round(accuracy * 100),
        working_memory_span: Math.min(7, patterns.length),
        pattern_recognition: patterns.length >= 5 ? 10 : (patterns.length / 5) * 10
      },
      correctRecalls,
      totalAttempts
    };
  };

  const generateRecommendations = (scores) => {
    const recommendations = [];
    
    if (scores.focus.overall <= 5) {
      recommendations.push({
        area: 'focus',
        suggestion: 'Break tasks into smaller chunks and use visual cues',
        activity: 'Short 10-minute focused games with Pink Teddy',
        urgency: 'high'
      });
    }
    
    if (scores.energy.overall >= 8) {
      recommendations.push({
        area: 'energy',
        suggestion: 'Include physical activity breaks every 20 minutes',
        activity: 'Dance sessions and movement games with Pink Teddy',
        urgency: 'medium'
      });
    }
    
    if (scores.memory.overall <= 5) {
      recommendations.push({
        area: 'memory',
        suggestion: 'Use repetition and visual memory techniques',
        activity: 'Memory games and story recall with Pink Teddy',
        urgency: 'medium'
      });
    }
    
    return recommendations;
  };

  if (isGameActive) {
    const GameComponent = games[currentGame].component;
    return (
      <GameComponent
        onComplete={(results) => completeGame(games[currentGame].id, results)}
        onBack={() => setIsGameActive(false)}
        childName={childData.name || user.profile?.name || 'Friend'}
        colors={colors}
        playSound={playSound}
        gameConfig={games[currentGame]}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Navigation Header */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: `3px solid ${colors.primary}`,
        borderRadius: '25px',
        padding: '1rem 2rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 6px 15px rgba(255, 182, 193, 0.3)'
              }}
            >
              ← Back to Pink Teddy
            </button>
          )}
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: colors.primary }}>
            🎮 Adventure Games
          </span>
        </div>
        
        <div style={{
          background: colors.success,
          color: 'white',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          Completed: {getCompletedCount()} of {games.length}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '5rem' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: colors.primary,
          margin: '0 0 1rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          🎮 Choose Your Adventure!
        </h1>
        <p style={{
          fontSize: '1.6rem',
          color: colors.text,
          margin: 0,
          maxWidth: '800px'
        }}>
          Hi {childData.name || user.profile?.name || 'Friend'}! Pick any game to play! 🌟✨
        </p>
      </div>

      {/* FIXED: Game selection grid - each game can be played individually */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2.5rem',
        maxWidth: '1200px',
        width: '100%'
      }}>
        {games.map((game, index) => {
          const completed = isGameCompleted(index);
          
          return (
            <div
              key={game.id}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '25px',
                padding: '2.5rem',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                border: `4px solid ${completed ? colors.success : game.color}`,
                opacity: completed ? 0.9 : 1,
                transform: completed ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => startGame(index)}
            >
              {completed && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: colors.success,
                  color: 'white',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  animation: 'celebration 2s ease-in-out infinite'
                }}>
                  ✓
                </div>
              )}

              <div style={{
                fontSize: '5rem',
                marginBottom: '1.5rem',
                animation: completed ? 'none' : 'pulse 2s infinite'
              }}>
                {game.icon}
              </div>

              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: completed ? colors.success : game.color,
                margin: '0 0 1rem 0'
              }}>
                {game.title}
              </h3>

              <p style={{
                fontSize: '1.3rem',
                color: colors.text,
                margin: '0 0 2rem 0',
                lineHeight: 1.6
              }}>
                {game.description}
              </p>

              <div style={{
                background: `${completed ? colors.success : game.color}20`,
                color: completed ? colors.success : game.color,
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                display: 'inline-block'
              }}>
                ⏱️ {game.duration} seconds of fun!
              </div>

              <button
                style={{
                  background: completed 
                    ? `linear-gradient(135deg, ${colors.success}, #059669)`
                    : `linear-gradient(135deg, ${game.color}, ${colors.accent})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '1.2rem 2.5rem',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  animation: completed ? 'none' : 'wiggle 1s ease-in-out infinite',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {completed ? '✓ Play Again!' : 'Start Adventure!'} 🚀
              </button>

              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                height: '6px',
                width: completed ? '100%' : '0%',
                background: `linear-gradient(to right, ${colors.success}, ${colors.accent})`,
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          );
        })}
      </div>

      {/* Complete All Games Button - shows when at least one game is completed */}
      {getCompletedCount() > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <button
            onClick={completeAllGames}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              padding: '2rem 4rem',
              fontSize: '2.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              animation: 'bounce 2s ease-in-out infinite',
              boxShadow: '0 15px 40px rgba(16, 185, 129, 0.4)'
            }}
          >
            🏆 Complete Adventure! 🏆
          </button>
          <p style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            color: colors.text,
            marginTop: '1rem'
          }}>
            You've completed {getCompletedCount()} game{getCompletedCount() !== 1 ? 's' : ''}! 
            Click to finish and see your results! ✨
          </p>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        
        @keyframes celebration {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        
        button:hover {
          transform: translateY(-2px) !important;
          opacity: 0.9 !important;
        }
        
        button:active {
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
};

// WORKING DANCE GAME COMPONENT
const EnergyDanceGame = ({ onComplete, onBack, childName, colors, playSound, gameConfig }) => {
  const [currentMove, setCurrentMove] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showMove, setShowMove] = useState(false);
  const [playerMoves, setPlayerMoves] = useState([]);
  const [gamePhase, setGamePhase] = useState('ready');
  const [energy, setEnergy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameConfig.duration);
  const [gameActive, setGameActive] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const danceMoves = [
    { name: 'clap', emoji: '👏', instruction: 'Clap your hands!', sound: 440 },
    { name: 'jump', emoji: '🦘', instruction: 'Jump up high!', sound: 660 },
    { name: 'spin', emoji: '🌪️', instruction: 'Spin around!', sound: 880 },
    { name: 'wave', emoji: '👋', instruction: 'Wave hello!', sound: 550 },
    { name: 'wiggle', emoji: '🐛', instruction: 'Wiggle your body!', sound: 770 },
    { name: 'heart', emoji: '💖', instruction: 'Make a heart!', sound: 990 },
    { name: 'star', emoji: '⭐', instruction: 'Reach for stars!', sound: 1100 },
    { name: 'dance', emoji: '💃', instruction: 'Free dance!', sound: 1320 }
  ];

  useEffect(() => {
    let timer;
    if (gameActive && !gameCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            console.log('⏰ Dance game timer finished');
            completeTest();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameActive, gameCompleted, timeLeft]);

  const startGame = () => {
    console.log('💃 Starting Dance Game');
    setGamePhase('playing');
    setGameActive(true);
    setGameCompleted(false);
    playSound(1320, 500, 'triangle');
    
    setTimeout(() => {
      if (!gameCompleted) {
        nextRound();
      }
    }, 1000);
  };

  const nextRound = () => {
    if (!gameActive || gameCompleted || timeLeft <= 0) {
      console.log('💃 Game not active or completed, stopping rounds');
      return;
    }

    console.log('💃 Starting round:', round + 1);
    const randomMove = danceMoves[Math.floor(Math.random() * danceMoves.length)];
    setCurrentMove(randomMove);
    setShowMove(true);
    setGamePhase('showing');
    
    playSound(randomMove.sound, 300, 'triangle');
    
    setTimeout(() => {
      if (!gameCompleted) {
        setShowMove(false);
        setGamePhase('responding');
        
        setTimeout(() => {
          if (gamePhase === 'responding' && !gameCompleted) {
            console.log('💃 Auto-skip for no response');
            recordMove('timeout');
          }
        }, 4000);
      }
    }, 3000);
  };

  const recordMove = (moveName) => {
    if (gamePhase !== 'responding' && moveName !== 'timeout') {
      console.log('💃 Move not recorded - wrong phase:', gamePhase);
      return;
    }
    
    if (gameCompleted) {
      console.log('💃 Move not recorded - game completed');
      return;
    }
    
    console.log('💃 Recording move:', moveName, 'Expected:', currentMove?.name);
    
    const isCorrect = moveName === currentMove?.name && moveName !== 'timeout';
    const newEnergy = Math.min(200, energy + (isCorrect ? 20 : 5));
    const newCombo = isCorrect ? combo + 1 : 0;
    
    const moveRecord = { 
      move: moveName, 
      correct: isCorrect, 
      timestamp: Date.now(),
      expectedMove: currentMove?.name,
      energy: newEnergy,
      round: round + 1
    };
    
    setPlayerMoves(prev => [...prev, moveRecord]);
    setEnergy(newEnergy);
    setCombo(newCombo);
    
    if (isCorrect) {
      const points = 1 + Math.floor(newCombo / 3);
      setScore(prev => prev + points);
      playSound(currentMove.sound, 300, 'triangle');
    } else if (moveName !== 'timeout') {
      playSound(200, 200, 'sawtooth');
    }
    
    setRound(prev => prev + 1);
    
    setTimeout(() => {
      if (gameActive && !gameCompleted && timeLeft > 1) {
        nextRound();
      } else {
        completeTest();
      }
    }, 1000);
  };

  const completeTest = () => {
    if (gameCompleted) {
      console.log('💃 Game already completed');
      return;
    }
    
    console.log('💃 Completing dance game with moves:', playerMoves.length);
    setGameActive(false);
    setGameCompleted(true);
    setGamePhase('completed');
    
    const accuracy = playerMoves.length > 0 
      ? (playerMoves.filter(m => m.correct).length / playerMoves.length) * 10 
      : 5;
    
    const rhythmScore = Math.max(1, Math.min(10, combo + 2));
    const movementIntensity = Math.max(1, Math.min(10, energy / 20));
    
    const results = {
      score,
      danceAccuracy: Math.round(accuracy),
      rhythm: rhythmScore,
      movementIntensity: Math.round(movementIntensity),
      totalMoves: playerMoves.length,
      correctMoves: playerMoves.filter(m => m.correct).length,
      maxCombo: combo,
      energyLevel: energy,
      gameTime: gameConfig.duration - timeLeft,
      movesList: playerMoves,
      completed: true
    };
    
    console.log('💃 Dance results:', results);
    
    setTimeout(() => {
      onComplete(results);
    }, 3000);
  };

  if (gamePhase === 'ready') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 100
        }}>
          <button
            onClick={onBack}
            style={{
              background: colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>

        <h2 style={{ fontSize: '4rem', color: 'white', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          💃🐻 Dance Battle with Pink Teddy! 💃🐻
        </h2>
        <p style={{ fontSize: '1.6rem', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
          Ready to dance, {childName}? Watch Pink Teddy's moves, then copy them!<br/>
          Get points for every correct move! 🔥
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '3rem',
          maxWidth: '600px'
        }}>
          {danceMoves.map(move => (
            <div key={move.name} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '15px',
              textAlign: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{move.emoji}</div>
              <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>
                {move.instruction}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={startGame}
          style={{
            background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '2rem 4rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            animation: 'dance 1s ease-in-out infinite',
            boxShadow: '0 15px 40px rgba(255, 20, 147, 0.4)'
          }}
        >
          💃 Let's Dance Battle! 💃
        </button>
      </div>
    );
  }

  if (gamePhase === 'completed') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '30px',
          padding: '4rem',
          border: '5px solid #FFD700',
          animation: 'bounce 0.8s ease-in-out infinite'
        }}>
          <h2 style={{ fontSize: '3rem', color: '#FF1493', marginBottom: '1rem' }}>
            🎉 Amazing Dancing! 🎉
          </h2>
          <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>💃</div>
          <p style={{ fontSize: '1.8rem', color: colors.text, marginBottom: '2rem' }}>
            You scored {score} points with {playerMoves.filter(m => m.correct).length} correct moves!
          </p>
          <p style={{ fontSize: '1.2rem', color: colors.textLight }}>
            Great job dancing, {childName}! 🌟
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100
      }}>
        <button
          onClick={() => {
            setGameActive(false);
            setGameCompleted(true);
            onBack();
          }}
          style={{
            background: colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '0.8rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '1.5rem 3rem',
        textAlign: 'center',
        zIndex: 100,
        border: '3px solid #FF6B35'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF6B35', marginBottom: '0.5rem' }}>
          💃 Round {round + 1} | Score: {score} | Combo: {combo}x | ⏰ {timeLeft}s
        </div>
        <div style={{
          background: '#FF6B35',
          height: '10px',
          borderRadius: '5px',
          marginTop: '0.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#FFD700',
            height: '100%',
            width: `${Math.min(100, (energy / 200) * 100)}%`,
            transition: 'width 0.3s ease',
            borderRadius: '5px'
          }} />
        </div>
        <div style={{ fontSize: '1rem', color: '#FF6B35', marginTop: '0.3rem' }}>
          🔥 Energy: {energy}
        </div>
      </div>

      {showMove && currentMove && gamePhase === 'showing' && (
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '30px',
          padding: '4rem',
          border: '5px solid #FF1493',
          animation: 'bounce 0.8s ease-in-out infinite'
        }}>
          <h3 style={{ fontSize: '2.5rem', color: '#FF1493', marginBottom: '1.5rem' }}>
            Pink Teddy Says:
          </h3>
          <div style={{ fontSize: '10rem', marginBottom: '1.5rem', animation: 'dance 0.8s ease-in-out infinite' }}>
            {currentMove.emoji}
          </div>
          <p style={{ fontSize: '2rem', color: colors.text, fontWeight: 'bold' }}>
            {currentMove.instruction}
          </p>
        </div>
      )}

      {gamePhase === 'responding' && !showMove && (
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '30px',
          padding: '3rem',
          border: '4px solid #FF1493'
        }}>
          <h3 style={{ fontSize: '2.5rem', color: '#FF1493', marginBottom: '2rem' }}>
            Your Turn! Copy the move! 🎯
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
            maxWidth: '600px'
          }}>
            {danceMoves.map(move => (
              <button
                key={move.name}
                onClick={() => recordMove(move.name)}
                disabled={gameCompleted}
                style={{
                  background: 'white',
                  border: `4px solid ${colors.energy}`,
                  borderRadius: '20px',
                  padding: '1.5rem',
                  cursor: gameCompleted ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: colors.text,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  opacity: gameCompleted ? 0.5 : 1
                }}
                onMouseEnter={(e) => !gameCompleted && (e.target.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => !gameCompleted && (e.target.style.transform = 'scale(1)')}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>{move.emoji}</div>
                {move.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dance {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.05); }
          50% { transform: rotate(8deg) scale(1.1); }
          75% { transform: rotate(-5deg) scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

// WORKING FOCUS GAME COMPONENT  
const FocusCatchGame = ({ onComplete, onBack, childName, colors, playSound, gameConfig }) => {
  const [stars, setStars] = useState([]);
  const [score, setScore] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(gameConfig.duration);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!gameStarted) return;

    const spawnStar = () => {
      const newStar = {
        id: Date.now() + Math.random(),
        x: Math.random() * (window.innerWidth - 300) + 150,
        y: Math.random() * (window.innerHeight - 400) + 200,
        createdAt: Date.now(),
        type: Math.random() > 0.8 ? 'bonus' : 'normal',
        speed: Math.random() * 2 + 1
      };
      setStars(prev => [...prev, newStar]);

      const lifetime = Math.random() * 2000 + 2000;
      setTimeout(() => {
        setStars(prev => {
          const remaining = prev.filter(star => star.id !== newStar.id);
          if (remaining.length < prev.length) {
            setReactions(prevReactions => [...prevReactions, {
              correct: false,
              reactionTime: lifetime,
              timestamp: Date.now(),
              type: 'missed'
            }]);
          }
          return remaining;
        });
      }, lifetime);
    };

    const starInterval = setInterval(spawnStar, Math.random() * 1000 + 800);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(starInterval);
      clearInterval(timer);
    };
  }, [gameStarted]);

  const catchStar = (starId, createdAt, starType) => {
    const reactionTime = Date.now() - createdAt;
    setStars(prev => prev.filter(star => star.id !== starId));
    
    const points = starType === 'bonus' ? 2 : 1;
    setScore(prev => prev + points);
    
    setReactions(prev => [...prev, { 
      correct: true, 
      reactionTime,
      timestamp: Date.now(),
      type: starType,
      points
    }]);
    
    const frequency = starType === 'bonus' ? 1200 : 800;
    playSound(frequency, 200, 'triangle');
  };

  const completeTest = () => {
    const averageTime = reactions.length > 0 
      ? reactions.filter(r => r.correct).reduce((sum, r) => sum + r.reactionTime, 0) / reactions.filter(r => r.correct).length 
      : 1000;
    
    const results = {
      score,
      reactions,
      averageTime,
      accuracy: reactions.length > 0 ? reactions.filter(r => r.correct).length / reactions.length : 0,
      correct: reactions.filter(r => r.correct).length,
      totalTime: Date.now() - startTime
    };
    onComplete(results);
  };

  if (!gameStarted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '20px', 
          zIndex: 100 
        }}>
          <button 
            onClick={onBack} 
            style={{
              background: colors.secondary, 
              color: 'white', 
              border: 'none',
              borderRadius: '20px', 
              padding: '0.8rem 1.5rem', 
              fontSize: '1rem',
              fontWeight: 'bold', 
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>

        <h2 style={{ fontSize: '3.5rem', color: colors.focus, marginBottom: '1rem' }}>
          ⚡⭐ Lightning Star Catcher! ⚡⭐
        </h2>
        <p style={{ fontSize: '1.6rem', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
          Get ready, {childName}! Catch the magical twinkling stars as fast as lightning!<br/>
          ⭐ Regular stars = 1 point • 🌟 Golden bonus stars = 2 points!
        </p>
        <button
          onClick={() => {
            setGameStarted(true);
            playSound(880, 400, 'triangle');
          }}
          style={{
            background: `linear-gradient(135deg, ${colors.focus}, ${colors.accent})`,
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '2rem 4rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            animation: 'pulse 2s infinite',
            boxShadow: '0 15px 40px rgba(78, 205, 196, 0.4)'
          }}
        >
          ⚡ Start Lightning Game! ⚡
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <button onClick={onBack} style={{
          background: colors.secondary, color: 'white', border: 'none',
          borderRadius: '20px', padding: '0.8rem 1.5rem', fontSize: '1rem',
          fontWeight: 'bold', cursor: 'pointer'
        }}>← Back</button>
      </div>

      <div style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px',
        padding: '1.5rem 3rem', zIndex: 100, textAlign: 'center',
        border: `3px solid ${colors.focus}`
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.focus, marginBottom: '0.5rem' }}>
          ⭐ Score: {score} | ⏰ {timeLeft}s
        </div>
        <div style={{ fontSize: '1.2rem', color: colors.text }}>
          Lightning reflexes, {childName}! ⚡
        </div>
      </div>

      {stars.map(star => (
        <div
          key={star.id}
          onClick={() => catchStar(star.id, star.createdAt, star.type)}
          style={{
            position: 'absolute', left: star.x, top: star.y,
            fontSize: star.type === 'bonus' ? '4rem' : '3rem', cursor: 'pointer',
            animation: `twinkle 0.8s ease-in-out infinite, float ${3 + star.speed}s ease-in-out infinite`,
            zIndex: 10, userSelect: 'none',
            filter: star.type === 'bonus' 
              ? 'drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 25px #FFD700)' 
              : 'drop-shadow(0 0 10px #87CEEB)',
            color: star.type === 'bonus' ? '#FFD700' : '#87CEEB'
          }}
        >
          {star.type === 'bonus' ? '🌟' : '⭐'}
        </div>
      ))}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.4; transform: scale(1.3) rotate(180deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// WORKING MEMORY GAME COMPONENT
const MemoryRecallGame = ({ onComplete, onBack, childName, colors, playSound, gameConfig }) => {
  const [gamePhase, setGamePhase] = useState('ready');
  const [treasures, setTreasures] = useState([]);
  const [revealedTreasures, setRevealedTreasures] = useState([]);
  const [correctRecalls, setCorrectRecalls] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [round, setRound] = useState(1);
  const [patterns, setPatterns] = useState([]);
  const [gameCompleted, setGameCompleted] = useState(false);

  const treasureEmojis = ['🧸', '🎁', '💎', '🌟', '🦄', '🎈', '🍭', '🎵'];

  const generateRound = () => {
    console.log('🧠 Generating round:', round);
    const numTreasures = Math.min(3 + Math.floor(round / 2), 6);
    const selectedTreasures = [];
    
    const gridSize = 4;
    const cellSize = 120;
    const startX = Math.max(100, (window.innerWidth - (gridSize * cellSize)) / 2);
    const startY = 250;
    
    const positions = [];
    for (let i = 0; i < numTreasures; i++) {
      let x, y, attempts = 0;
      do {
        x = startX + (Math.floor(Math.random() * gridSize) * cellSize);
        y = startY + (Math.floor(Math.random() * 3) * cellSize);
        attempts++;
      } while (positions.some(pos => pos.x === x && pos.y === y) && attempts < 20);
      
      positions.push({ x, y });
      
      selectedTreasures.push({
        id: Date.now() + i + Math.random(),
        x: x,
        y: y,
        emoji: treasureEmojis[Math.floor(Math.random() * treasureEmojis.length)],
        found: false
      });
    }
    
    console.log('🧠 Generated treasures:', selectedTreasures);
    setTreasures(selectedTreasures);
    setRevealedTreasures([]);
    setPatterns(prev => [...prev, selectedTreasures.map(t => `${t.x}-${t.y}`)]);
  };

  const startGame = () => {
    console.log('🧠 Starting memory game');
    generateRound();
    setGamePhase('showing');
    playSound(880, 400, 'triangle');
    
    const showTime = 3000 + (round * 1000);
    setTimeout(() => {
      if (!gameCompleted) {
        console.log('🧠 Hiding treasures, starting test phase');
        setGamePhase('testing');
      }
    }, showTime);
  };

  const findTreasure = (treasureId) => {
    if (gamePhase !== 'testing' || gameCompleted) {
      console.log('🧠 Click ignored - wrong phase or completed');
      return;
    }
    
    const treasure = treasures.find(t => t.id === treasureId);
    if (!treasure || treasure.found) {
      console.log('🧠 Treasure not found or already found');
      return;
    }
    
    console.log('🧠 Found treasure:', treasure.emoji);
    setTotalAttempts(prev => prev + 1);
    setCorrectRecalls(prev => prev + 1);
    setRevealedTreasures(prev => [...prev, treasureId]);
    setTreasures(prev => prev.map(t => 
      t.id === treasureId ? {...t, found: true} : t
    ));
    
    playSound(1100, 300, 'triangle');
    
    const currentRevealedCount = revealedTreasures.length + 1;
    const totalTreasures = treasures.length;
    
    console.log('🧠 Progress:', currentRevealedCount, '/', totalTreasures);
    
    if (currentRevealedCount >= totalTreasures) {
      console.log('🧠 Round completed!');
      
      if (round >= 4) {
        setTimeout(() => {
          completeTest();
        }, 1000);
      } else {
        setTimeout(() => {
          if (!gameCompleted) {
            console.log('🧠 Starting next round');
            setRound(prev => prev + 1);
            generateRound();
            setGamePhase('showing');
            
            const nextShowTime = 3000 + (round * 1000);
            setTimeout(() => {
              if (!gameCompleted) {
                setGamePhase('testing');
              }
            }, nextShowTime);
          }
        }, 1500);
      }
    }
  };

  const completeTest = () => {
    if (gameCompleted) return;
    
    console.log('🧠 Completing memory game');
    setGameCompleted(true);
    setGamePhase('completed');
    
    const accuracy = totalAttempts > 0 ? correctRecalls / totalAttempts : 0;
    const results = {
      score: Math.round(accuracy * 10),
      correctRecalls,
      totalAttempts,
      patterns,
      rounds: round,
      accuracy: accuracy,
      completed: true
    };
    
    console.log('🧠 Memory game results:', results);
    
    setTimeout(() => {
      onComplete(results);
    }, 2000);
  };

  if (gamePhase === 'ready') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
          <button onClick={onBack} style={{
            background: colors.secondary, color: 'white', border: 'none',
            borderRadius: '20px', padding: '0.8rem 1.5rem', fontSize: '1rem',
            fontWeight: 'bold', cursor: 'pointer'
          }}>← Back</button>
        </div>

        <h2 style={{ 
          fontSize: '4rem', color: 'white', marginBottom: '1rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🗺️✨ Treasure Hunt Memory Quest! 🗺️✨
        </h2>
        
        <p style={{ 
          fontSize: '1.8rem', color: 'white', textAlign: 'center', 
          marginBottom: '2rem', maxWidth: '600px', lineHeight: 1.6
        }}>
          Get ready, {childName}! I'll show you magical treasures, then you need to find them all! 🔍
        </p>
        
        <button onClick={startGame} style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', border: 'none', borderRadius: '30px',
          padding: '2rem 4rem', fontSize: '2rem', fontWeight: 'bold',
          cursor: 'pointer', boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)',
          animation: 'pulse 2s infinite'
        }}>🕵️ Start Treasure Hunt! 🕵️</button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <button onClick={onBack} style={{
          background: colors.secondary, color: 'white', border: 'none',
          borderRadius: '20px', padding: '0.8rem 1.5rem', fontSize: '1rem',
          fontWeight: 'bold', cursor: 'pointer'
        }}>← Back</button>
      </div>

      <div style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px',
        padding: '1.5rem 3rem', zIndex: 100, textAlign: 'center',
        border: '3px solid #667eea'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
          🗺️ Quest {round}/4 | Found: {revealedTreasures.length}/{treasures.length}
        </div>
        
        {gamePhase === 'showing' && (
          <div style={{
            fontSize: '1.2rem', color: '#F59E0B', fontWeight: 'bold',
            animation: 'pulse 1.5s infinite'
          }}>👀 Watch carefully!</div>
        )}
        
        {gamePhase === 'testing' && (
          <div style={{
            fontSize: '1.2rem', color: '#10B981', fontWeight: 'bold',
            animation: 'pulse 1.5s infinite'
          }}>🎯 Find the treasures!</div>
        )}
      </div>

      {treasures.map(treasure => (
        <div key={treasure.id} 
          onClick={(e) => { e.stopPropagation(); findTreasure(treasure.id); }}
          style={{
            position: 'absolute', left: treasure.x, top: treasure.y,
            fontSize: '4rem', cursor: gamePhase === 'testing' ? 'pointer' : 'default',
            opacity: (gamePhase === 'showing' || treasure.found) ? 1 : 0,
            transform: treasure.found ? 'scale(1.2)' : 'scale(1)',
            transition: 'all 0.5s ease', userSelect: 'none', zIndex: 10,
            padding: '10px', borderRadius: '15px',
            background: treasure.found ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
            border: treasure.found ? '3px solid #10B981' : 'none',
            animation: treasure.found ? 'celebration 1s ease-in-out' : 'none'
          }}>
          {treasure.emoji}
        </div>
      ))}

      {gamePhase === 'testing' && treasures.map(treasure => (
        !treasure.found && (
          <div key={`spot-${treasure.id}`} 
            onClick={(e) => { e.stopPropagation(); findTreasure(treasure.id); }}
            style={{
              position: 'absolute', left: treasure.x - 15, top: treasure.y - 15,
              width: '110px', height: '110px', borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.1)', 
              border: '3px dashed rgba(255, 255, 255, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', animation: 'pulse 2s infinite', zIndex: 5
            }}>
            ❓
          </div>
        )
      ))}

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes celebration { 0%, 100% { transform: scale(1.2) rotate(0deg); } 50% { transform: scale(1.5) rotate(180deg); } }
      `}</style>
    </div>
  );
};

export default DailyMonitoringGames;
