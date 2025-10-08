import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

const EnhancedParentDashboard = ({ user, parentChildId, onLogout, onSwitchToChild, onBack }) => {
  const [childData, setChildData] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const colors = {
    primary: '#FF69B4',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: 'linear-gradient(135deg, #F0F4FF 0%, #E6E6FA 50%, #FFF0F5 100%)',
    text: '#2D3748',
    textLight: '#6B7280',
    card: 'rgba(255, 255, 255, 0.95)'
  };

  useEffect(() => {
    if (user && (parentChildId || user.profile?.childName)) {
      loadChildData();
    } else {
      setLoading(false);
    }
  }, [user, parentChildId]);

  const loadChildData = async () => {
    try {
      setLoading(true);
      
      if (parentChildId) {
        // Load specific child by ID
        const childDoc = await getDoc(doc(db, 'users', parentChildId));
        if (childDoc.exists()) {
          setChildData({ id: childDoc.id, ...childDoc.data() });
          await loadChildTests(parentChildId);
        }
      } else if (user.profile?.childName) {
        // Search for child by name
        const childQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'child'),
          where('profile.name', '==', user.profile.childName),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const childSnapshot = await getDocs(childQuery);
        
        if (!childSnapshot.empty) {
          const childDoc = childSnapshot.docs;
          setChildData({ id: childDoc.id, ...childDoc.data() });
          await loadChildTests(childDoc.id);
        }
      }
    } catch (error) {
      console.error('Error loading child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildTests = async (childId) => {
    try {
      const testsQuery = query(
        collection(db, 'dailyTests'),
        where('childId', '==', childId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const testsSnapshot = await getDocs(testsQuery);
      
      const tests = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentTests(tests);
    } catch (error) {
      console.error('Error loading child tests:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    return colors.danger;
  };

  const getRiskLevel = (score) => {
    if (score >= 8) return { level: 'Low Risk', color: colors.success };
    if (score >= 6) return { level: 'Medium Risk', color: colors.warning };
    return { level: 'Needs Attention', color: colors.danger };
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>📊</div>
          <p style={{ fontSize: '1.5rem', color: colors.primary }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Navigation Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderBottom: `3px solid ${colors.secondary}`,
        padding: '1.5rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
                  cursor: 'pointer'
                }}
              >
                ← Back to Login
              </button>
            )}
            <h1 style={{ 
              fontSize: '2rem', 
              color: colors.secondary, 
              margin: 0,
              fontWeight: 'bold'
            }}>
              📊 Parent Dashboard
            </h1>
            {childData && (
              <div style={{
                background: colors.primary + '20',
                padding: '0.5rem 1rem',
                borderRadius: '15px',
                border: `2px solid ${colors.primary}`,
                fontSize: '1rem',
                color: colors.primary,
                fontWeight: 'bold'
              }}>
                👶 Tracking: {childData.profile?.name || 'Child'}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {onSwitchToChild && (
              <button
                onClick={onSwitchToChild}
                style={{
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                👦 Switch to Child View
              </button>
            )}
            <button
              onClick={onLogout}
              style={{
                background: colors.danger,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👋 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '1rem',
          borderRadius: '20px',
          border: `2px solid ${colors.secondary}`
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'progress', label: '📈 Progress', icon: '📈' },
            { id: 'recommendations', label: '💡 Tips', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? colors.secondary : 'transparent',
                color: activeTab === tab.id ? 'white' : colors.secondary,
                border: 'none',
                borderRadius: '15px',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!childData ? (
          // No child data found
          <div style={{
            background: colors.card,
            borderRadius: '25px',
            padding: '4rem',
            textAlign: 'center',
            border: `3px solid ${colors.warning}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2.5rem', color: colors.warning, marginBottom: '1.5rem' }}>
              👶 No Child Activity Found
            </h2>
            <p style={{ fontSize: '1.4rem', color: colors.text, marginBottom: '2rem', lineHeight: 1.6 }}>
              {user.profile?.childName 
                ? `We couldn't find any activity for "${user.profile.childName}". Make sure your child has used the app with this exact name.`
                : 'No child name was provided during registration. To track your child\'s activity, they need to use the app.'
              }
            </p>
            
            <div style={{
              background: colors.secondary + '20',
              padding: '2rem',
              borderRadius: '20px',
              border: `2px solid ${colors.secondary}`,
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: colors.secondary, marginBottom: '1rem' }}>How to Track Your Child:</h3>
              <ol style={{ color: colors.text, fontSize: '1.1rem', textAlign: 'left', lineHeight: 1.8 }}>
                <li>Ask your child to use PixiePath on their device</li>
                <li>Make sure they enter their name exactly as: <strong>"{user.profile?.childName || 'their name'}"</strong></li>
                <li>They should complete at least one Pink Teddy session</li>
                <li>Refresh this dashboard to see their activity</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.2rem 2.5rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(255, 105, 180, 0.3)'
              }}
            >
              🔄 Refresh Dashboard
            </button>
          </div>
        ) : activeTab === 'overview' ? (
          // Overview Tab
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Child Summary */}
            <div style={{
              background: colors.card,
              borderRadius: '25px',
              padding: '2.5rem',
              border: `3px solid ${colors.primary}`,
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '2.5rem', color: colors.primary, marginBottom: '1.5rem' }}>
                👶 {childData.profile?.name}'s Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{childData.profile?.avatar || '😊'}</div>
                  <h3 style={{ color: colors.text, margin: '0.5rem 0' }}>Age: {childData.profile?.age} years</h3>
                  <p style={{ color: colors.textLight, margin: 0 }}>
                    Registered: {new Date(childData.createdAt?.toDate()).toLocaleDateString()}
                  </p>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: colors.success, fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {childData.progress?.totalGems || 0}
                  </div>
                  <h3 style={{ color: colors.text, margin: '0.5rem 0' }}>Total Gems Earned</h3>
                  <p style={{ color: colors.textLight, margin: 0 }}>
                    {childData.progress?.conversationCount || 0} conversations with Pink Teddy
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', color: colors.warning, fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {recentTests.length}
                  </div>
                  <h3 style={{ color: colors.text, margin: '0.5rem 0' }}>Assessment Sessions</h3>
                  <p style={{ color: colors.textLight, margin: 0 }}>
                    Last activity: {childData.lastActiveDate 
                      ? new Date(childData.lastActiveDate.toDate()).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Assessments */}
            {recentTests.length > 0 && (
              <div style={{
                background: colors.card,
                borderRadius: '25px',
                padding: '2.5rem',
                border: `3px solid ${colors.secondary}`,
                boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '2.5rem', color: colors.secondary, marginBottom: '1.5rem' }}>
                  📈 Recent Assessment Results
                </h2>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {recentTests.slice(0, 3).map((test, index) => (
                    <div key={test.id} style={{
                      background: index === 0 ? colors.primary + '10' : 'white',
                      border: `2px solid ${index === 0 ? colors.primary : colors.secondary}`,
                      borderRadius: '20px',
                      padding: '2rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ color: colors.text, margin: 0 }}>
                          {index === 0 && '🏆 '}{new Date(test.timestamp.toDate()).toLocaleDateString()}
                        </h3>
                        <div style={{
                          background: index === 0 ? colors.primary : colors.secondary,
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '15px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          {index === 0 ? 'Latest' : `${index + 1} days ago`}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {['focus', 'energy', 'memory'].map(area => {
                          const score = test.behavioralScores?.[area]?.overall || 0;
                          const risk = getRiskLevel(score);
                          return (
                            <div key={area} style={{
                              background: 'white',
                              padding: '1.5rem',
                              borderRadius: '15px',
                              border: `2px solid ${getScoreColor(score)}`,
                              textAlign: 'center'
                            }}>
                              <h4 style={{ color: colors.text, margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>
                                {area === 'focus' ? '🎯 Focus' : area === 'energy' ? '⚡ Energy' : '🧠 Memory'}
                              </h4>
                              <div style={{ 
                                fontSize: '2rem', 
                                fontWeight: 'bold', 
                                color: getScoreColor(score),
                                margin: '0.5rem 0'
                              }}>
                                {score}/10
                              </div>
                              <div style={{
                                background: risk.color + '20',
                                color: risk.color,
                                padding: '0.3rem 0.8rem',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}>
                                {risk.level}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'progress' ? (
          // Progress Tab
          <div style={{
            background: colors.card,
            borderRadius: '25px',
            padding: '2.5rem',
            border: `3px solid ${colors.success}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2.5rem', color: colors.success, marginBottom: '1.5rem' }}>
              📈 {childData.profile?.name}'s Progress Over Time
            </h2>
            
            {recentTests.length > 1 ? (
              <div>
                <p style={{ fontSize: '1.3rem', color: colors.text, marginBottom: '2rem' }}>
                  Tracking progress across {recentTests.length} assessment sessions
                </p>
                
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {['focus', 'energy', 'memory'].map(area => {
                    const scores = recentTests.reverse().map(test => test.behavioralScores?.[area]?.overall || 0);
                    const latest = scores[scores.length - 1];
                    const previous = scores[scores.length - 2] || latest;
                    const trend = latest > previous ? '📈' : latest < previous ? '📉' : '➡️';
                    const trendColor = latest > previous ? colors.success : latest < previous ? colors.danger : colors.warning;
                    
                    return (
                      <div key={area} style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '20px',
                        border: `3px solid ${getScoreColor(latest)}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ color: colors.text, margin: 0, textTransform: 'capitalize', fontSize: '1.8rem' }}>
                            {area === 'focus' ? '🎯 Focus Skills' : area === 'energy' ? '⚡ Energy Management' : '🧠 Memory Performance'}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '2rem', color: trendColor }}>{trend}</span>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(latest) }}>
                              {latest}/10
                            </span>
                          </div>
                        </div>
                        
                        <div style={{
                          background: '#F3F4F6',
                          height: '12px',
                          borderRadius: '6px',
                          marginBottom: '1rem',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: getScoreColor(latest),
                            height: '100%',
                            width: `${latest * 10}%`,
                            borderRadius: '6px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        
                        <p style={{ color: colors.textLight, margin: 0, fontSize: '1.1rem' }}>
                          {latest > 7 ? 'Excellent performance! 🌟' : 
                           latest > 5 ? 'Good progress, keep it up! 👍' : 
                           'Focus area for improvement 💪'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ color: colors.text, marginBottom: '1rem' }}>More Data Needed</h3>
                <p style={{ color: colors.textLight, fontSize: '1.2rem' }}>
                  Progress tracking will be available after your child completes more assessment sessions.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Recommendations Tab
          <div style={{
            background: colors.card,
            borderRadius: '25px',
            padding: '2.5rem',
            border: `3px solid ${colors.warning}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2.5rem', color: colors.warning, marginBottom: '1.5rem' }}>
              💡 Personalized Tips & Recommendations
            </h2>
            
            {recentTests.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {recentTests.recommendations?.map((rec, index) => (
                    <div key={index} style={{
                      background: 'white',
                      padding: '2rem',
                      borderRadius: '20px',
                      border: `3px solid ${colors.primary}`
                    }}>
                      <h3 style={{ color: colors.primary, marginBottom: '1rem', textTransform: 'capitalize' }}>
                        {rec.area === 'focus' ? '🎯' : rec.area === 'energy' ? '⚡' : '🧠'} {rec.area} Improvement
                      </h3>
                      <p style={{ fontSize: '1.3rem', color: colors.text, marginBottom: '1rem' }}>
                        <strong>Suggestion:</strong> {rec.suggestion}
                      </p>
                      <div style={{
                        background: colors.secondary + '20',
                        padding: '1rem',
                        borderRadius: '15px',
                        border: `2px solid ${colors.secondary}`
                      }}>
                        <strong style={{ color: colors.secondary }}>Try this activity:</strong> {rec.activity}
                      </div>
                    </div>
                  )) || []}
                </div>

                <div style={{
                  background: colors.success + '20',
                  padding: '2rem',
                  borderRadius: '20px',
                  border: `3px solid ${colors.success}`,
                  marginTop: '2rem'
                }}>
                  <h3 style={{ color: colors.success, marginBottom: '1rem' }}>🌟 General Tips for ADHD Support</h3>
                  <ul style={{ color: colors.text, fontSize: '1.1rem', lineHeight: 1.8 }}>
                    <li>Create a consistent daily routine with Pink Teddy sessions</li>
                    <li>Use positive reinforcement when your child completes activities</li>
                    <li>Break learning tasks into shorter, manageable segments</li>
                    <li>Provide a quiet, distraction-free environment for focused activities</li>
                    <li>Celebrate small wins and progress milestones</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💡</div>
                <h3 style={{ color: colors.text, marginBottom: '1rem' }}>Personalized Tips Coming Soon</h3>
                <p style={{ color: colors.textLight, fontSize: '1.2rem' }}>
                  Complete assessment sessions to receive personalized recommendations for your child.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

export default EnhancedParentDashboard;
