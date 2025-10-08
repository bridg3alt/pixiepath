import React from 'react';

const SubjectDashboard = ({ onSubjectSelect, userName = "Friend" }) => {
  const subjects = [
    {
      id: "english",
      name: "English",
      icon: "📚",
      modules: 8,
      completed: 3,
      description: "Learn letters, words, and stories!",
      className: "subject-card-english"
    },
    {
      id: "maths", 
      name: "Maths",
      icon: "🔢",
      modules: 6,
      completed: 2,
      description: "Count, add, and solve puzzles!",
      className: "subject-card-maths"
    },
    {
      id: "evs",
      name: "EVS",
      icon: "🌱",
      modules: 5,
      completed: 1,
      description: "Explore nature and our world!",
      className: "subject-card-evs"
    }
  ];

  const getProgress = (completed, total) => Math.round((completed / total) * 100);

  return (
    <>
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

      {/* Content */}
      <div className="screen-content">
        {/* Header */}
        <h1 className="title-main">Welcome back, {userName}! 🎉</h1>
        <p className="subtitle">Choose your learning adventure today!</p>
        
        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item" style={{ animationDelay: '0.2s' }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <span>50 gems</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '0.4s' }}>
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
            <span>3 day streak</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '0.6s' }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
            <span>Level 5</span>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <div
              key={subject.id}
              className={`subject-card ${subject.className}`}
              onClick={() => onSubjectSelect(subject)}
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              {/* Subject Icon */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1rem',
                  animation: 'bounceGentle 3s ease-in-out infinite',
                  animationDelay: `${index * 0.3}s`
                }}>
                  {subject.icon}
                </div>
                <h2 style={{
                  fontFamily: 'Fredoka',
                  fontSize: '2rem',
                  color: '#374151',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {subject.name}
                </h2>
                <p style={{
                  fontFamily: 'Nunito',
                  fontSize: '1rem',
                  color: '#6B7280',
                  lineHeight: '1.5'
                }}>
                  {subject.description}
                </p>
              </div>

              {/* Progress Section */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontFamily: 'Nunito',
                    color: '#6B7280',
                    fontWeight: '600'
                  }}>
                    Progress
                  </span>
                  <span style={{
                    fontFamily: 'Fredoka',
                    fontSize: '1.125rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {subject.completed}/{subject.modules} modules
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${getProgress(subject.completed, subject.modules)}%`,
                      animationDelay: `${(index * 0.2) + 1}s`
                    }}
                  ></div>
                </div>
                
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <span style={{
                    fontFamily: 'Fredoka',
                    fontSize: '1.5rem',
                    color: '#059669',
                    fontWeight: '600'
                  }}>
                    {getProgress(subject.completed, subject.modules)}% Complete!
                  </span>
                </div>

                {/* Continue Button */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                    color: 'white',
                    borderRadius: '25px',
                    fontFamily: 'Fredoka',
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                  }}>
                    Continue Learning! 🚀
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SubjectDashboard;
