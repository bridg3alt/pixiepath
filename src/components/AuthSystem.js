import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthSystem = ({ onAuthChange }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('child');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          const fullUserData = { ...user, ...userData };
          setUser(fullUserData);
          onAuthChange(fullUserData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
          onAuthChange(user);
        }
      } else {
        setUser(null);
        onAuthChange(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [onAuthChange]);

  const handleChildLogin = async (childData) => {
    try {
      setLoading(true);
      const { user } = await signInAnonymously(auth);
      
      await setDoc(doc(db, 'users', user.uid), {
        userType: 'child',
        profile: childData,
        createdAt: new Date(),
        progress: {
          currentLevel: 1,
          totalGems: 0,
          streakDays: 0,
          subjects: {
            english: { level: 1, completed: 0, total: 10 },
            maths: { level: 1, completed: 0, total: 10 },
            evs: { level: 1, completed: 0, total: 10 }
          }
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Child login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleParentRegister = async (email, password, parentData) => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        userType: 'parent',
        profile: parentData,
        createdAt: new Date(),
        children: []
      });
      
      return { success: true };
    } catch (error) {
      console.error('Parent register error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error('Parent login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4 animate-bounce">🐻</div>
          <div className="text-white text-2xl font-fredoka">Loading PixiePath...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-8xl mb-4 animate-bounce">🐻</div>
          <h1 className="text-4xl font-fredoka font-bold text-purple-600">PixiePath</h1>
          <p className="text-gray-600 font-nunito mt-2">Learning made fun!</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAuthMode('child')}
            className={`flex-1 py-3 px-4 rounded-lg font-nunito font-semibold transition-colors ${
              authMode === 'child' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👧👦 I'm a Kid!
          </button>
          <button
            onClick={() => setAuthMode('parent')}
            className={`flex-1 py-3 px-4 rounded-lg font-nunito font-semibold transition-colors ${
              authMode === 'parent' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👨‍👩‍👧‍👦 I'm a Parent
          </button>
        </div>

        {authMode === 'child' && (
          <ChildLoginForm onLogin={handleChildLogin} loading={loading} />
        )}

        {authMode === 'parent' && (
          <ParentAuthForms 
            onLogin={handleParentLogin}
            onRegister={handleParentRegister}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

const ChildLoginForm = ({ onLogin, loading }) => {
  const [childData, setChildData] = useState({
    name: '',
    age: 6,
    avatar: '😊'
  });

  const avatars = ['😊', '😎', '🤓', '😇', '🥳', '🤠', '👑', '🦄'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (childData.name.trim()) {
      await onLogin(childData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
          What's your name? 🌟
        </label>
        <input
          type="text"
          value={childData.name}
          onChange={(e) => setChildData({...childData, name: e.target.value})}
          className="w-full p-4 border-2 border-purple-200 rounded-lg font-nunito text-lg focus:border-purple-400 focus:outline-none"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
          How old are you? 🎂
        </label>
        <select
          value={childData.age}
          onChange={(e) => setChildData({...childData, age: parseInt(e.target.value)})}
          className="w-full p-4 border-2 border-purple-200 rounded-lg font-nunito text-lg focus:border-purple-400 focus:outline-none"
        >
          {[...Array(11)].map((_, i) => (
            <option key={i + 4} value={i + 4}>{i + 4} years old</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
          Choose your avatar! 🎭
        </label>
        <div className="grid grid-cols-4 gap-2">
          {avatars.map(avatar => (
            <button
              key={avatar}
              type="button"
              onClick={() => setChildData({...childData, avatar})}
              className={`p-3 rounded-lg text-3xl transition-all duration-200 ${
                childData.avatar === avatar 
                  ? 'bg-purple-200 ring-4 ring-purple-400 scale-110' 
                  : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !childData.name.trim()}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-fredoka text-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting Adventure...' : 'Start Learning! 🚀'}
      </button>
    </form>
  );
};

const ParentAuthForms = ({ onLogin, onRegister, loading }) => {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-fredoka font-bold text-gray-700 mb-2">
        Parent Dashboard Coming Soon!
      </h2>
      <p className="text-gray-600 font-nunito">
        We're building an amazing parent dashboard for you!
      </p>
    </div>
  );
};

export default AuthSystem;
