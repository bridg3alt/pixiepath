import React, { useState } from 'react';

const LearningRoadmap = ({ currentLevel = 1, onLevelSelect }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const generateLevels = () => {
    const subjects = [
      { id: 'english', name: 'English', icon: '📚', color: '#E6E6FA' },
      { id: 'maths', name: 'Maths', icon: '🔢', color: '#F0FFF0' },
      { id: 'evs', name: 'EVS', icon: '🌱', color: '#FFDBCC' }
    ];

    const levelTitles = {
      english: [
        'Letter Land', 'Word World', 'Story Time', 'Reading Rainbow', 'Spell Master',
        'Grammar Galaxy', 'Vocabulary Village', 'Sentence Safari', 'Poetry Park', 'Writing Workshop'
      ],
      maths: [
        'Number Ninja', 'Count Castle', 'Add Adventure', 'Subtract Safari', 'Multiply Mayhem',
        'Division Dragon', 'Fraction Fun', 'Geometry Garden', 'Pattern Palace', 'Math Magic'
      ],
      evs: [
        'Animal Kingdom', 'Plant Paradise', 'Weather World', 'Space Station', 'Ocean Odyssey',
        'Forest Friends', 'Desert Discovery', 'Mountain Mystery', 'River Rapids', 'Earth Explorer'
      ]
    };

    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const subjectIndex = (i - 1) % 3;
      const subject = subjects[subjectIndex];
      const titleIndex = Math.floor((i - 1) / 3);
      
      levels.push({
        id: i,
        number: i,
        subject: subject,
        title: levelTitles[subject.id][titleIndex % levelTitles[subject.id].length],
        isUnlocked: i <= currentLevel + 1,
        isCompleted: i < currentLevel,
        isCurrent: i === currentLevel,
        stars: i < currentLevel ? Math.floor(Math.random() * 3) + 1 : 0,
        position: calculatePosition(i)
      });
    }
    
    return levels;
  };

  const calculatePosition = (levelNum) => {
    const levelIndex = levelNum - 1;
    const row = Math.floor(levelIndex / 5);
    const col = levelIndex % 5;
    const x = row % 2 === 0 ? col * 120 : (4 - col) * 120;
    const y = row * 150;
    return { x: x + 60, y: y + 80 };
  };

  const levels = generateLevels();

  const handleLevelClick = (level) => {
    if (!level.isUnlocked) return;
    setSelectedLevel(level);
  };

  const startLevel = () => {
    if (selectedLevel && onLevelSelect) {
      onLevelSelect(selectedLevel);
    }
    setSelectedLevel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-50 to-pink-100">
      <div className="text-center py-8">
        <h1 className="text-5xl font-fredoka font-bold text-purple-600 mb-2">
          Your Learning Journey! 🗺️
        </h1>
        <p className="text-xl font-nunito text-gray-600">
          Complete levels to unlock new adventures!
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg">
            <span className="font-fredoka font-bold text-purple-600">Level {currentLevel}</span>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 pb-20">
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 700 1200"
        >
          {levels.slice(0, -1).map((level, index) => {
            const nextLevel = levels[index + 1];
            return (
              <line
                key={`path-${level.id}`}
                x1={level.position.x}
                y1={level.position.y}
                x2={nextLevel.position.x}
                y2={nextLevel.position.y}
                stroke="url(#pathGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.7"
              />
            );
          })}
          
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {levels.map((level, index) => (
          <div
            key={level.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: level.position.x,
              top: level.position.y,
              zIndex: level.isCurrent ? 20 : 10
            }}
          >
            <button
              onClick={() => handleLevelClick(level)}
              disabled={!level.isUnlocked}
              className={`
                relative w-20 h-20 rounded-2xl border-4 font-fredoka font-bold text-white text-lg
                transition-all duration-300 transform
                ${level.isUnlocked 
                  ? 'hover:scale-110 hover:shadow-2xl cursor-pointer border-white' 
                  : 'cursor-not-allowed border-gray-300 opacity-50'
                }
                ${level.isCompleted ? 'ring-4 ring-green-400' : ''}
                ${level.isCurrent ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
              `}
              style={{
                background: level.isUnlocked 
                  ? `linear-gradient(145deg, ${level.subject.color}, ${level.subject.color}dd)`
                  : '#f3f4f6',
                boxShadow: level.isUnlocked ? '0 10px 25px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <div className="text-2xl mb-1">
                {level.isUnlocked ? level.subject.icon : '🔒'}
              </div>
              
              <div className={`text-xs ${level.isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                {level.number}
              </div>

              {level.isCompleted && level.stars > 0 && (
                <div className="absolute -top-2 -right-2 flex">
                  {Array.from({ length: level.stars }, (_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">⭐</span>
                  ))}
                </div>
              )}

              {level.isCurrent && (
                <div 
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-3xl"
                  style={{ animation: 'bounceGentle 2s infinite' }}
                >
                  🐻
                </div>
              )}
            </button>

            <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-sm font-nunito font-bold text-gray-700 whitespace-nowrap">
                {level.title}
              </p>
              <p className="text-xs font-nunito text-gray-500">
                {level.subject.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-8xl mb-4">{selectedLevel.subject.icon}</div>
              
              <h2 className="text-2xl font-fredoka font-bold text-gray-800 mb-2">
                {selectedLevel.title}
              </h2>
              <p className="text-gray-600 font-nunito mb-1">
                Level {selectedLevel.number}
              </p>
              <p className="text-purple-600 font-nunito font-semibold mb-6">
                {selectedLevel.subject.name.toUpperCase()}
              </p>
              
              {selectedLevel.isCompleted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-nunito">
                    ✅ Completed with {selectedLevel.stars} star{selectedLevel.stars !== 1 ? 's' : ''}!
                  </p>
                  <p className="text-green-600 text-sm mt-1">You can replay to earn more stars!</p>
                </div>
              ) : selectedLevel.isCurrent ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-nunito">
                    🎯 This is your current level!
                  </p>
                  <p className="text-yellow-600 text-sm mt-1">Ready for the challenge?</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-nunito">
                    🚀 New adventure awaits!
                  </p>
                  <p className="text-blue-600 text-sm mt-1">Time to learn something new!</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-nunito font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startLevel}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-nunito font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  {selectedLevel.isCompleted ? 'Play Again!' : 'Start Level!'} 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LearningRoadmap;
