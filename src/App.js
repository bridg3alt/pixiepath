import React, { useState, useEffect } from 'react';
import { auth, db } from './config/firebase';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Import all enhanced components
import DailyMonitoringGames from './components/DailyMonitoringGames';
import EnhancedTeddyAI from './components/EnhancedTeddyAI';
import EnhancedParentDashboard from './components/EnhancedParentDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('auth-mode');
  const [authMode, setAuthMode] = useState('child');
  const [error, setError] = useState('');
  const [parentChildId, setParentChildId] = useState(null); // Track child for parent

  // Child data
  const [childData, setChildData] = useState({
    name: '',
    age: 6,
    avatar: '😊'
  });

  // Parent data
  const [parentData, setParentData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    parentName: '',
    childName: '',
    childAge: 6,
    isRegistering: false
  });

  const avatars = ['😊', '😎', '🤓', '😇', '🥳', '🤠', '👑', '🦄', '🐻', '🌟', '🎈', '🌈'];

  // Enhanced colors for ADHD-friendly design
  const colors = {
    primary: '#FF69B4',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: 'linear-gradient(135deg, #FFE4E1 0%, #E6E6FA 50%, #F0F8FF 100%)',
    text: '#2D3748',
    textLight: '#6B7280',
    card: 'rgba(255, 255, 255, 0.95)'
  };

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          const fullUserData = { ...user, ...userData };
          setUser(fullUserData);
          
          console.log('👤 User data loaded:', userData);
          
          // Enhanced routing logic
          if (userData?.userType === 'parent') {
            console.log('🧑‍💼 Routing to enhanced parent dashboard');
            
            // If parent has a child name, try to find child's activity
            if (userData.profile?.childName) {
              try {
                const childQuery = query(
                  collection(db, 'users'), 
                  where('userType', '==', 'child'),
                  where('profile.name', '==', userData.profile.childName)
                );
                const childSnapshot = await getDocs(childQuery);
                
                if (!childSnapshot.empty) {
                  const childDoc = childSnapshot.docs;
                  setParentChildId(childDoc.id);
                  console.log('👶 Found child for parent tracking:', childDoc.id);
                }
              } catch (error) {
                console.error('Error finding child for parent:', error);
              }
            }
            
            setCurrentView('parent-dashboard');
          } else {
            // Child user - start with Pink AI Teddy first!
            console.log('🐻 Starting with Pink AI Teddy first!');
            setCurrentView('teddy-companion');
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          setUser(user);
          setCurrentView('teddy-companion');
        }
      } else {
        console.log('🚪 No user - showing login page');
        setUser(null);
        setCurrentView('auth-mode');
        setParentChildId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Child login with anonymous auth
  const handleChildLogin = async (e) => {
    e.preventDefault();
    if (childData.name.trim()) {
      try {
        setLoading(true);
        setError('');
        
        const result = await signInAnonymously(auth);
        
        // Save enhanced child data to Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          userType: 'child',
          profile: {
            ...childData,
            registrationDate: new Date()
          },
          createdAt: new Date(),
          progress: {
            currentLevel: 1,
            totalGems: 0,
            streakDays: 0,
            sessionsCompleted: 0,
            totalTimeSpent: 0,
            conversationCount: 0,
            dailyTestsCompleted: 0,
            subjects: {
              english: { level: 1, completed: 0, total: 10, masteryScore: 0 },
              maths: { level: 1, completed: 0, total: 10, masteryScore: 0 },
              science: { level: 1, completed: 0, total: 10, masteryScore: 0 }
            }
          },
          behavioralHistory: {
            focusPatterns: [],
            energyLevels: [],
            memoryScores: [],
            adhdIndicators: {
              inattentionRisk: 'unknown',
              hyperactivityMarkers: 'unknown',
              impulsivityIndicators: 'unknown'
            }
          },
          lastActiveDate: new Date(),
          preferences: {
            musicEnabled: true,
            voiceEnabled: true,
            difficultyLevel: 'adaptive'
          }
        });
        
        console.log('✅ Child registered successfully');
      } catch (error) {
        console.error('Child login error:', error);
        setError('Login failed: ' + error.message);
        setLoading(false);
      }
    }
  };

  // Parent registration with child tracking
  const handleParentRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (parentData.password !== parentData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (parentData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, parentData.email, parentData.password);
      
      // Save enhanced parent data to Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: parentData.email,
        userType: 'parent',
        profile: {
          parentName: parentData.parentName,
          childName: parentData.childName,
          childAge: parentData.childAge,
          registrationDate: new Date()
        },
        createdAt: new Date(),
        children: [],
        settings: {
          screenTimeLimit: 60,
          allowedSubjects: ['english', 'maths', 'science'],
          aiInteractionEnabled: true,
          voiceEnabled: true,
          notificationsEnabled: true,
          reportFrequency: 'weekly'
        },
        dashboardPreferences: {
          defaultTimeframe: '7days',
          preferredCharts: ['behavioral_trends', 'adhd_insights'],
          alertThresholds: {
            lowFocus: 4,
            highRisk: 'medium'
          }
        }
      });
      
      setError('');
      console.log('✅ Parent registered successfully');
    } catch (error) {
      console.error('Parent register error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Parent login
  const handleParentLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, parentData.email, parentData.password);
      setError('');
      console.log('✅ Parent logged in successfully');
    } catch (error) {
      console.error('Parent login error:', error);
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    signOut(auth);
    setParentChildId(null);
    console.log('👋 User logged out');
  };

  // Navigation functions with back button support
  const goToTeddyChat = () => {
    console.log('🐻 Going to Pink Teddy chat');
    setCurrentView('teddy-companion');
  };

  const goToDailyGames = () => {
    console.log('🎮 Going to daily games');
    setCurrentView('daily-games');
  };

  const goToLearningDashboard = () => {
    console.log('🎓 Going to learning dashboard');
    setCurrentView('learning-dashboard');
  };

  const goToParentDashboard = () => {
    console.log('📊 Going to parent dashboard');
    setCurrentView('parent-dashboard');
  };

  const goToLogin = () => {
    console.log('🚪 Going to login');
    setCurrentView('auth-mode');
  };

  // Loading screen
  if (loading) {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '8rem', 
            marginBottom: '2rem', 
            animation: 'spin 2s linear infinite' 
          }}>
            🐻
          </div>
          <div style={{ 
            fontSize: '2.5rem', 
            color: colors.primary, 
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            PixiePath Loading...
          </div>
          <div style={{ 
            fontSize: '1.3rem', 
            color: colors.textLight 
          }}>
            Preparing your magical AI companion! ✨
          </div>
        </div>
      </div>
    );
  }

  // 🔥 MAIN LOGIN PAGE
  if (currentView === 'auth-mode') {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: colors.card,
          borderRadius: '30px',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: `3px solid ${colors.primary}`,
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: colors.primary,
              margin: '0 0 1rem 0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              🐻 PixiePath
            </h1>
            <p style={{
              fontSize: '1.4rem',
              color: colors.textLight,
              margin: 0
            }}>
              AI Learning Companion with Songs, Stories & Mindfulness
            </p>
          </div>

          {/* Mode Selection */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '3rem',
            background: '#F3F4F6',
            padding: '0.5rem',
            borderRadius: '25px'
          }}>
            <button
              onClick={() => setAuthMode('child')}
              style={{
                flex: 1,
                background: authMode === 'child' ? colors.primary : 'transparent',
                color: authMode === 'child' ? 'white' : colors.textLight,
                border: 'none',
                borderRadius: '20px',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              👦 I'm a Kid!
            </button>
            <button
              onClick={() => setAuthMode('parent')}
              style={{
                flex: 1,
                background: authMode === 'parent' ? colors.secondary : 'transparent',
                color: authMode === 'parent' ? 'white' : colors.textLight,
                border: 'none',
                borderRadius: '20px',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              👨‍👩‍👧‍👦 I'm a Parent
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: colors.danger + '20',
              color: colors.danger,
              padding: '1rem',
              borderRadius: '15px',
              marginBottom: '2rem',
              border: `2px solid ${colors.danger}`,
              fontWeight: 'bold'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Child Login Form */}
          {authMode === 'child' && (
            <form onSubmit={handleChildLogin}>
              <div style={{ marginBottom: '2rem' }}>
                <input
                  type="text"
                  placeholder="What's your name? 🌟"
                  value={childData.name}
                  onChange={(e) => setChildData({...childData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    border: `3px solid ${colors.primary}`,
                    borderRadius: '20px',
                    fontSize: '1.3rem',
                    outline: 'none',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    background: 'white'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: '1rem'
                }}>
                  How old are you? 🎂
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(age => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setChildData({...childData, age})}
                      style={{
                        background: childData.age === age ? colors.primary : 'white',
                        color: childData.age === age ? 'white' : colors.primary,
                        border: `2px solid ${colors.primary}`,
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: '1rem'
                }}>
                  Pick your avatar! ✨
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem'
                }}>
                  {avatars.map(avatar => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setChildData({...childData, avatar})}
                      style={{
                        background: childData.avatar === avatar ? colors.primary + '30' : 'white',
                        border: `3px solid ${childData.avatar === avatar ? colors.primary : '#E5E7EB'}`,
                        borderRadius: '15px',
                        padding: '1rem',
                        fontSize: '2.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!childData.name.trim()}
                style={{
                  width: '100%',
                  background: childData.name.trim() ? 
                    `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : '#CCC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '1.5rem',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  cursor: childData.name.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: childData.name.trim() ? 
                    '0 10px 30px rgba(255, 105, 180, 0.4)' : 'none'
                }}
              >
                🚀 Start My Magical Adventure!
              </button>
            </form>
          )}

          {/* Parent Login/Register Forms */}
          {authMode === 'parent' && (
            <div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                background: '#F3F4F6',
                padding: '0.5rem',
                borderRadius: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setParentData({...parentData, isRegistering: false})}
                  style={{
                    flex: 1,
                    background: !parentData.isRegistering ? colors.secondary : 'transparent',
                    color: !parentData.isRegistering ? 'white' : colors.textLight,
                    border: 'none',
                    borderRadius: '15px',
                    padding: '0.8rem 1rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setParentData({...parentData, isRegistering: true})}
                  style={{
                    flex: 1,
                    background: parentData.isRegistering ? colors.secondary : 'transparent',
                    color: parentData.isRegistering ? 'white' : colors.textLight,
                    border: 'none',
                    borderRadius: '15px',
                    padding: '0.8rem 1rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Register
                </button>
              </div>

              <form onSubmit={parentData.isRegistering ? handleParentRegister : handleParentLogin}>
                {parentData.isRegistering && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={parentData.parentName}
                      onChange={(e) => setParentData({...parentData, parentName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: `2px solid ${colors.secondary}`,
                        borderRadius: '15px',
                        fontSize: '1rem',
                        outline: 'none',
                        background: 'white'
                      }}
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={parentData.email}
                    onChange={(e) => setParentData({...parentData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid ${colors.secondary}`,
                      borderRadius: '15px',
                      fontSize: '1rem',
                      outline: 'none',
                      background: 'white'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={parentData.password}
                    onChange={(e) => setParentData({...parentData, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid ${colors.secondary}`,
                      borderRadius: '15px',
                      fontSize: '1rem',
                      outline: 'none',
                      background: 'white'
                    }}
                    required
                  />
                </div>

                {parentData.isRegistering && (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={parentData.confirmPassword}
                        onChange={(e) => setParentData({...parentData, confirmPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: `2px solid ${colors.secondary}`,
                          borderRadius: '15px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: 'white'
                        }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <input
                        type="text"
                        placeholder="Child's Name (Optional - for activity tracking)"
                        value={parentData.childName}
                        onChange={(e) => setParentData({...parentData, childName: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: `2px solid ${colors.secondary}`,
                          borderRadius: '15px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: 'white'
                        }}
                      />
                      <div style={{
                        fontSize: '0.9rem',
                        color: colors.textLight,
                        marginTop: '0.5rem',
                        textAlign: 'left'
                      }}>
                        💡 Enter your child's name to track their activities and progress
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '1.2rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  {parentData.isRegistering ? '🎯 Create Parent Account' : '🚀 Access Dashboard'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced Pink AI Teddy Companion (FIRST VIEW for children!)
  if (currentView === 'teddy-companion') {
    return (
      <EnhancedTeddyAI
        user={user}
        childData={user?.profile || childData}
        onComplete={goToDailyGames}
        onLogout={handleLogout}
        onBack={null} // No back button from first view
      />
    );
  }

  // Enhanced Daily Monitoring Games
  if (currentView === 'daily-games') {
    return (
      <DailyMonitoringGames
        user={user}
        childData={user?.profile || childData}
        onComplete={(testResults) => {
          console.log('🎮 Daily games completed:', testResults);
          goToLearningDashboard();
        }}
        onBack={goToTeddyChat} // Back to Pink Teddy
      />
    );
  }

  // Learning Dashboard with Navigation
  if (currentView === 'learning-dashboard') {
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
          border: `3px solid ${colors.success}`,
          borderRadius: '25px',
          padding: '1rem 2rem',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={goToDailyGames}
              style={{
                background: colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 6px 15px rgba(139, 92, 246, 0.3)'
              }}
            >
              ← Back to Games
            </button>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: colors.success }}>
              🎓 Learning Adventure Complete!
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              background: '#EF4444',
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

        <div style={{
          background: colors.card,
          borderRadius: '30px',
          padding: '4rem',
          textAlign: 'center',
          maxWidth: '800px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          border: `3px solid ${colors.success}`,
          marginTop: '5rem'
        }}>
          <h1 style={{
            fontSize: '4rem',
            color: colors.success,
            marginBottom: '2rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            🎓✨ Amazing Job, {user?.profile?.name || childData.name}!
          </h1>
          
          <p style={{
            fontSize: '1.6rem',
            color: colors.text,
            marginBottom: '3rem',
            lineHeight: 1.6
          }}>
            You've had wonderful conversations with Pink Teddy and completed all your magical games! 
            Pink Teddy is so proud of your awesome progress! 🐻💕
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: colors.primary + '20',
              padding: '2rem',
              borderRadius: '20px',
              border: `2px solid ${colors.primary}`
            }}>
              <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>📚</h3>
              <h4 style={{ fontSize: '1.3rem', color: colors.primary, margin: '0 0 0.5rem 0' }}>English</h4>
              <p style={{ fontSize: '1rem', color: colors.text, margin: 0 }}>Stories & Words</p>
            </div>

            <div style={{
              background: colors.secondary + '20',
              padding: '2rem',
              borderRadius: '20px',
              border: `2px solid ${colors.secondary}`
            }}>
              <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>🔢</h3>
              <h4 style={{ fontSize: '1.3rem', color: colors.secondary, margin: '0 0 0.5rem 0' }}>Math</h4>
              <p style={{ fontSize: '1rem', color: colors.text, margin: 0 }}>Numbers & Fun</p>
            </div>

            <div style={{
              background: colors.warning + '20',
              padding: '2rem',
              borderRadius: '20px',
              border: `2px solid ${colors.warning}`
            }}>
              <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>🔬</h3>
              <h4 style={{ fontSize: '1.3rem', color: colors.warning, margin: '0 0 0.5rem 0' }}>Science</h4>
              <p style={{ fontSize: '1rem', color: colors.text, margin: 0 }}>Experiments</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={goToTeddyChat}
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 3rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(255, 105, 180, 0.4)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🐻💕 Chat with Pink Teddy Again!
            </button>

            <button
              onClick={goToDailyGames}
              style={{
                background: `linear-gradient(135deg, ${colors.warning}, ${colors.success})`,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 3rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🎮 Play Adventure Games Again!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Parent Dashboard
  if (currentView === 'parent-dashboard') {
    return (
      <EnhancedParentDashboard
        user={user}
        parentChildId={parentChildId}
        onLogout={handleLogout}
        onSwitchToChild={goToTeddyChat}
        onBack={goToLogin}
      />
    );
  }

  // Default fallback
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: colors.primary, marginBottom: '1rem' }}>
          🐻 Welcome to PixiePath!
        </h1>
        <p style={{ fontSize: '1.3rem', color: colors.textLight, marginBottom: '2rem' }}>
          Your magical AI learning companion with songs, stories, and mindfulness!
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentView('auth-mode')}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚪 Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// CSS Animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
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
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
