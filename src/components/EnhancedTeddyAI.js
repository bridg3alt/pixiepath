import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Enhanced Gemini API setup with your key
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyA_Q19CTwIDqcx2hTlQQCP0aBJUl3kfVs4';

let genAI;
try {
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('🤖 Real Gemini AI connected for Pink Teddy!');
  }
} catch (error) {
  console.error('❌ Gemini AI initialization failed:', error);
}

const EnhancedTeddyAI = ({ user, childData, onComplete, onLogout, onBack }) => {
  const [teddyState, setTeddyState] = useState('waking-up');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [aiStatus, setAiStatus] = useState('checking');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [dailyTestData, setDailyTestData] = useState(null);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [currentActivity, setCurrentActivity] = useState('chat'); // chat, story, song, mindfulness
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if Teddy is speaking
  const audioContextRef = useRef(null);
  const speechUtteranceRef = useRef(null); // Track current speech

  // Enhanced Pink Winnie-the-Pooh colors
  const colors = {
    primary: '#FF69B4',      // Hot pink
    secondary: '#FFB6C1',    // Light pink  
    accent: '#FF1493',       // Deep pink
    warm: '#FFA0C9',         // Warm pink
    honey: '#FFE1E9',        // Very light pink
    background: 'linear-gradient(135deg, #FFE4E1 0%, #FFF0F5 50%, #FFE4E6 100%)',
    text: '#2D3748',
    bearPink: '#FF69B4',     // Main teddy color
    bearLight: '#FFB6C1',    // Light teddy color
    bearDark: '#FF1493',     // Dark teddy accents
    gold: '#FFD700',         // Honey gold
    nature: '#98FB98',       // Nature green
    mindfulness: '#E6E6FA'   // Lavender for mindfulness
  };

  // Nursery rhymes and stories database
  const nurseryRhymes = [
    {
      title: "🌟 Twinkle Pink Star",
      lyrics: `🎵 Twinkle, twinkle, pink little star,
How I wonder what you are!
Up above the world so high,
Like a honey drop in the sky!
Twinkle, twinkle, pink little star,
How I wonder what you are! 🎵`,
      melody: [523, 523, 784, 784, 880, 880, 784, 698, 698, 659, 659, 587, 587, 523]
    },
    {
      title: "🐻 Pink Teddy's Honey Song",
      lyrics: `🎵 Pink Teddy loves his honey sweet,
Buzzing bees make it neat!
In the forest, by the tree,
Happy as happy can be!
Pink and fuzzy, warm and bright,
Teddy hugs you day and night! 🎵`,
      melody: [659, 698, 784, 659, 523, 587, 659, 698, 784, 880, 784, 698, 659]
    },
    {
      title: "🌈 Rainbow Friendship Song",
      lyrics: `🎵 Red and yellow, pink and blue,
All the colors, me and you!
Friends together, hearts so true,
Pink Teddy loves you through and through!
Colors dancing in the sky,
Like our friendship, you and I! 🎵`,
      melody: [523, 587, 659, 698, 784, 659, 523, 587, 659, 698, 784, 880, 784]
    }
  ];

  const storyBank = [
    {
      title: "🍯 Pink Teddy's Honey Adventure",
      content: `Once upon a time, Pink Teddy discovered a magical honey tree in the Hundred Acre Wood! 🌳✨

The tree sparkled with golden honey that tasted like sunshine and giggles. Pink Teddy met a friendly bee named Buzzy who taught him that the best honey comes from sharing kindness!

Together, they shared honey with all their forest friends - Rabbit, Owl, and little Piglet. Everyone was so happy, and Pink Teddy learned that sharing makes everything sweeter! 🐝🍯

And they all lived happily, with hearts full of honey-sweetness and friendship! The end! 💕`
    },
    {
      title: "🌟 The Sleepy Star Adventure",
      content: `Pink Teddy looked up at the twinkling stars one peaceful night. One little star seemed tired and dim! ⭐

"What's wrong, little star?" asked Pink Teddy gently. 

"I'm so sleepy, but I can't fall asleep in the sky," whispered the star.

So Pink Teddy sang the softest lullaby, and told the star wonderful dreams about fluffy clouds and rainbow bridges. Soon, the little star began to glow brightly again! 🌈

"Thank you, Pink Teddy!" the star sparkled. "Now I know that rest makes us shine brighter!"

And Pink Teddy smiled, knowing that helping friends makes the whole world brighter! ✨`
    },
    {
      title: "🦋 The Magic Garden Discovery",
      content: `One sunny morning, Pink Teddy found a secret garden behind the old oak tree! 🌳🌸

In this magical place, flowers giggled when butterflies tickled them, and trees whispered happy secrets! Pink Teddy discovered that every flower had a special gift - some smelled like vanilla cookies, others played tiny music when the wind danced through them! 🦋🎵

Pink Teddy spent the day making friends with a wise old sunflower who told jokes, and a shy rosebud who loved to play hide-and-seek!

"This garden teaches us that there's magic everywhere when we look with wonder!" Pink Teddy realized. And from that day on, every walk became an adventure! 🌻💫`
    }
  ];

  const mindfulnessActivities = [
    {
      title: "🫧 Bubble Breathing",
      instruction: "Let's blow magical bubbles with our breath! Breathe in slowly like you're smelling honey... hold it... now breathe out like you're blowing the biggest, most beautiful bubble! Watch it float away with all your worries!",
      duration: 60,
      visual: "🫧"
    },
    {
      title: "🐻 Teddy Bear Hugs",
      instruction: "Give yourself the biggest, warmest Pink Teddy hug! Wrap your arms around yourself and squeeze gently. Feel how safe and loved you are! You are precious and wonderful, just like Pink Teddy's favorite friend!",
      duration: 45,
      visual: "🤗"
    },
    {
      title: "🌳 Forest Listening",
      instruction: "Close your eyes and imagine you're in a peaceful forest with Pink Teddy. Listen... can you hear birds singing? Leaves rustling? Your own gentle heartbeat? Every sound is like nature's music, welcoming you home!",
      duration: 90,
      visual: "🌲"
    },
    {
      title: "✨ Gratitude Stars",
      instruction: "Think of three things that made you smile today! Each one is like a bright star in your heart. Pink Teddy is grateful for YOU! You make the world brighter just by being you!",
      duration: 75,
      visual: "⭐"
    }
  ];

  // ADHD-friendly background music frequencies
  const createBackgroundMusic = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Create soft, calming tones
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(audioContext.destination);
      gainNode2.connect(audioContext.destination);
      
      // ADHD-friendly frequencies (40Hz binaural beats base)
      oscillator1.frequency.value = 261.63; // C4 - calming
      oscillator2.frequency.value = 329.63; // E4 - uplifting
      
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // Very soft volume
      gainNode1.gain.setValueAtTime(0.02, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(0.015, audioContext.currentTime);
      
      // Create gentle fade in/out pattern
      const now = audioContext.currentTime;
      
      oscillator1.start(now);
      oscillator2.start(now);
      
      // Auto-stop after 30 seconds and restart for continuous loop
      oscillator1.stop(now + 30);
      oscillator2.stop(now + 30);
      
      return { oscillator1, oscillator2, gainNode1, gainNode2 };
      
    } catch (error) {
      console.log('🔇 Background music not available');
      return null;
    }
  };

  // Initialize teddy and load daily data
  useEffect(() => {
    loadDailyTestData();
    checkAIStatus();
    initializeTeddy();
    
    // Start background music
    if (musicEnabled) {
      const music = createBackgroundMusic();
      setBackgroundMusic(music);
      
      // Restart music every 30 seconds
      const musicInterval = setInterval(() => {
        if (musicEnabled) {
          const newMusic = createBackgroundMusic();
          setBackgroundMusic(newMusic);
        }
      }, 30000);
      
      return () => clearInterval(musicInterval);
    }
  }, []);

  const loadDailyTestData = async () => {
    if (!user?.uid) return;
    
    try {
      const today = new Date().toDateString();
      const testDoc = await getDoc(doc(db, 'dailyTests', `${user.uid}_${today}`));
      
      if (testDoc.exists()) {
        const data = testDoc.data();
        setDailyTestData(data);
        console.log('📊 Daily behavioral data loaded:', data);
      }
    } catch (error) {
      console.error('Error loading daily test data:', error);
    }
  };

  const checkAIStatus = async () => {
    try {
      if (genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        await model.generateContent('Hello, test connection for Pink Teddy');
        setAiStatus('connected');
        console.log('🤖 Real Gemini AI Status: Connected to Pink Teddy!');
      } else {
        setAiStatus('backup');
        console.log('💭 AI Status: Using enhanced backup responses');
      }
    } catch (error) {
      console.error('AI connection test failed:', error);
      setAiStatus('backup');
    }
  };

  const initializeTeddy = () => {
    setTeddyState('waking-up');
    playTeddySound(330, 800); // Wake up sound
    
    setTimeout(() => {
      setTeddyState('stretching');
      playTeddySound(440, 600); // Stretch sound
      
      setTimeout(() => {
        setTeddyState('happy');
        
        // Enhanced personalized welcome with new features
        let welcomeMessage = `Hello my sweetest friend ${childData.name}! I'm your Pink Teddy, and I'm absolutely buzzing with excitement to spend time with you! 🐻💕 

I know the most wonderful songs, magical stories, and peaceful mindfulness adventures! What sounds delightful to you today, honey bear?`;
        
        if (dailyTestData && dailyTestData.behavioralScores) {
          const focus = dailyTestData.behavioralScores.focus?.overall || 5;
          const energy = dailyTestData.behavioralScores.energy?.overall || 5;
          
          if (focus >= 8) {
            welcomeMessage = `Well, bless my honey jar! ${childData.name}, your super-focused mind reminds me of how I concentrate when looking for the perfect honey tree! Ready for some thinking adventures or maybe a beautiful story? 🧠🍯✨`;
          } else if (energy >= 8) {
            welcomeMessage = `Bouncing bother! ${childData.name}, your amazing energy makes me want to dance around the Hundred Acre Wood! Let's have some bouncy fun together - maybe a song or dance! 🦘💃✨`;
          } else if (focus <= 4) {
            welcomeMessage = `Hello sweet ${childData.name}! Come here for the biggest, warmest Pink Teddy hug! Let's try something peaceful and calming together - maybe some mindful breathing or a gentle story! 🤗💕🧘`;
          }
        }
        
        setCurrentMessage(welcomeMessage);
        speakMessage(welcomeMessage);
        setTeddyState('talking');
      }, 2000);
    }, 1000);
  };

  // Enhanced Teddy sound effects
  const playTeddySound = (frequency, duration = 300, type = 'sine') => {
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
      console.log('🔇 Audio not available, Pink Teddy continues silently');
    }
  };

  // Play melody for songs
  const playMelody = (melody) => {
    if (!melody || melody.length === 0) return;
    
    let noteIndex = 0;
    const playNote = () => {
      if (noteIndex < melody.length) {
        playTeddySound(melody[noteIndex], 400, 'sine');
        noteIndex++;
        setTimeout(playNote, 500);
      }
    };
    playNote();
  };

  // Song singing function
  const singNurseryRhyme = (rhyme) => {
    setTeddyState('singing');
    setCurrentMessage(`🎵 ${rhyme.title} 🎵\n\n${rhyme.lyrics}`);
    
    // Play melody first
    if (rhyme.melody) {
      playMelody(rhyme.melody);
    }
    
    // Then speak/sing the lyrics
    setTimeout(() => {
      speakMessage(`Let me sing for you! ${rhyme.title}. ${rhyme.lyrics.replace(/🎵/g, '')}`);
    }, 1000);
  };

  // Story telling function
  const tellStory = (story) => {
    setTeddyState('storytelling');
    setCurrentMessage(story.content);
    
    // Gentle story introduction sound
    playTeddySound(523, 600, 'triangle');
    
    setTimeout(() => {
      speakMessage(`Let me tell you a wonderful story called ${story.title}. ${story.content}`);
    }, 800);
  };

  // Mindfulness activity function
  const guideMindfulness = (activity) => {
    setTeddyState('mindfulness');
    setCurrentMessage(`${activity.visual} ${activity.title}\n\n${activity.instruction}`);
    
    // Calming mindfulness sound
    playTeddySound(440, 800, 'sine');
    
    setTimeout(() => {
      speakMessage(`Let's do a peaceful mindfulness exercise called ${activity.title}. ${activity.instruction}`);
    }, 1000);
    
    // Auto return to chat after activity duration
    setTimeout(() => {
      setCurrentActivity('chat');
      setTeddyState('happy');
      const completeMessage = `Beautiful work, ${childData.name}! You did wonderfully! How do you feel now, honey bear? 🌟`;
      setCurrentMessage(completeMessage);
      speakMessage(completeMessage);
    }, activity.duration * 1000);
  };

  // STOP AUDIO FUNCTION - NEW FEATURE!
  const stopTeddyAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setTeddyState('happy');
      console.log('🔇 Pink Teddy audio stopped');
    }
  };

  // Real-time streaming Gemini AI (enhanced with new features)
  const generateStreamingTeddyResponse = async (userInput) => {
    try {
      if (!genAI || aiStatus !== 'connected') {
        return getEnhancedPinkTeddyResponse(userInput);
      }

      setTeddyState('thinking');
      setIsTyping(true);
      setStreamingResponse('');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Enhanced behavioral analysis
      const behavioralContext = dailyTestData ? analyzeBehavioralPatterns(dailyTestData) : '';
      const childAge = childData.age || 6;
      const childName = childData.name || 'friend';
      
      const context = `You are Pink Teddy, a wise, gentle, and loving PINK version of Winnie-the-Pooh for ${childAge}-year-old ${childName}. 
      You are an AI companion for children, designed to be calming, encouraging, and joyful.
      
      PERSONALITY TRAITS:
      - Kind, patient, and understanding like Winnie-the-Pooh
      - Loves honey, adventures, songs, stories, and friendship
      - Speaks in a gentle, warm, slightly whimsical way
      - Uses "Oh my honey stars!" and "Bother and buzzing bees!" occasionally
      - Makes references to honey, the Hundred Acre Wood, and magical places
      - Always encouraging and never judgmental
      - LOVES singing nursery rhymes and telling magical stories
      - Enjoys mindfulness and peaceful moments
      
      BEHAVIORAL ANALYSIS:
      ${behavioralContext}
      
      CONVERSATION CONTEXT:
      ${conversation.slice(-3).map(c => `${c.speaker}: ${c.message}`).join('\n')}
      
      RESPONSE GUIDELINES:
      - Keep responses to 1-2 sentences (ADHD-friendly)
      - Be encouraging and joyful always
      - Include 1-2 relevant emojis per response
      - Offer to sing songs, tell stories, or do mindfulness activities
      - Ask engaging follow-up questions about adventures and fun
      - Use honey/nature metaphors when appropriate
      - Focus on joy, learning, creativity, and adventure
      
      CRITICAL: You help children feel excited about learning and adventures. Always maintain the warm, honey-sweet, magical personality.`;
      
      const prompt = `${context}\n\nChild says: "${userInput}"\n\nPink Teddy responds (warm, honey-sweet, encouraging, focusing on fun and adventure):`;
      
      // Streaming response implementation
      const result = await model.generateContentStream(prompt);
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        setStreamingResponse(fullResponse);
        
        // Realistic typing delay for ADHD-friendly pace
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      setIsTyping(false);
      
      // Ensure response is appropriate length
      if (fullResponse.length > 300) {
        fullResponse = fullResponse.substring(0, 300);
        const lastSentence = Math.max(
          fullResponse.lastIndexOf('.'), 
          fullResponse.lastIndexOf('?'), 
          fullResponse.lastIndexOf('!')
        );
        if (lastSentence > 100) {
          fullResponse = fullResponse.substring(0, lastSentence + 1);
        }
      }
      
      console.log('🐻 Pink Teddy real-time response:', fullResponse);
      
      return fullResponse;
      
    } catch (error) {
      console.error('Streaming Gemini AI error:', error);
      setIsTyping(false);
      return getEnhancedPinkTeddyResponse(userInput);
    }
  };

  const analyzeBehavioralPatterns = (testData) => {
    if (!testData.behavioralScores) return 'No recent behavioral data available.';
    
    const { focus, energy, memory } = testData.behavioralScores;
    
    let analysis = [];
    
    // Focus analysis with detailed breakdown
    if (focus.overall >= 8) {
      analysis.push("Child shows exceptional attention and concentration abilities");
    } else if (focus.overall >= 6) {
      analysis.push("Child has good focus skills with sustained attention");
    } else if (focus.overall >= 4) {
      analysis.push("Child benefits from shorter, engaging activities");
    } else {
      analysis.push("Child needs gentle guidance and frequent encouragement");
    }
    
    // Energy analysis
    if (energy.overall >= 8) {
      analysis.push("with high energy perfect for active learning and songs");
    } else if (energy.overall >= 6) {
      analysis.push("with good energy levels for interactive activities");
    } else if (energy.overall >= 4) {
      analysis.push("with moderate energy, enjoys gentle activities");
    } else {
      analysis.push("with calm energy, benefits from soothing activities like stories");
    }
    
    // Memory analysis
    if (memory.overall >= 8) {
      analysis.push("and excellent memory for learning songs and stories");
    } else if (memory.overall >= 6) {
      analysis.push("and good memory function for creative activities");
    } else if (memory.overall >= 4) {
      analysis.push("and developing memory skills through repetition and songs");
    } else {
      analysis.push("and benefits from simple, repeated activities and gentle guidance");
    }
    
    return analysis.join(", ") + ".";
  };

  const getEnhancedPinkTeddyResponse = (userInput) => {
    const input = userInput.toLowerCase();
    const childName = childData.name || 'friend';
    
    // Song requests
    if (input.includes('sing') || input.includes('song') || input.includes('music')) {
      return `Oh my honey stars! I'd absolutely love to sing for you, ${childName}! I know the most delightful nursery rhymes! Which would you like to hear? 🎵✨`;
    }
    
    // Story requests
    if (input.includes('story') || input.includes('tale') || input.includes('tell me')) {
      return `Wonderful idea, ${childName}! I have the most magical stories about adventures in the Hundred Acre Wood! Shall I tell you one? 📚✨`;
    }
    
    // Mindfulness requests
    if (input.includes('calm') || input.includes('relax') || input.includes('peaceful') || input.includes('breathe')) {
      return `What a lovely idea, dear ${childName}! Let's do something peaceful and calming together. I know wonderful mindfulness adventures! 🌟💆`;
    }
    
    // Context-aware responses based on behavioral data
    const focusLevel = dailyTestData?.behavioralScores?.focus.overall || 5;
    const energyLevel = dailyTestData?.behavioralScores?.energy.overall || 5;
    
    // Greeting responses with behavioral context
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      if (focusLevel >= 8) {
        return `Oh my stars and honey! Hello my wonderfully focused ${childName}! Your bright mind makes my pink heart as warm as a sunny day in the Hundred Acre Wood! 🌞💕`;
      } else if (focusLevel <= 4) {
        return `Hello sweet ${childName}! Come here for the biggest, softest Pink Teddy hug! Sometimes we all need extra honey-sweet comfort, and I'm here for you! 🤗🍯`;
      } else {
        return `Hello dear ${childName}! Oh bother, how lovely to see my special friend today! I've been thinking of honey and adventures! 🐻💕`;
      }
    }
    
    // Learning and focus responses
    if (input.includes('learn') || input.includes('school') || input.includes('study')) {
      if (focusLevel >= 8) {
        return `Oh my honey jars! Your wonderful focusing mind reminds me of how carefully I watch for the perfect honey tree! What exciting learning adventure shall we explore? 🧠🍯`;
      } else if (focusLevel <= 4) {
        return `No worries at all, ${childName}! Even this silly old Pink Teddy sometimes gets distracted by butterflies! Let's learn together, bit by bit, like gathering honey drop by drop! 🦋📚`;
      } else {
        return `Learning adventures are simply the best, ${childName}! Like exploring new paths in the Hundred Acre Wood - what wonderful discovery shall we make today? 🗺️✨`;
      }
    }
    
    // Energy and activity responses
    if (input.includes('play') || input.includes('game') || input.includes('fun')) {
      if (energyLevel >= 8) {
        return `Bouncing bother! Your amazing energy makes me want to bounce like Tigger through the Wood! Let's have a wonderfully active adventure together! 🦘💃`;
      } else if (energyLevel <= 4) {
        return `Oh, that sounds lovely, ${childName}! Sometimes the best games are the quiet, cozy ones - like watching clouds or gentle honey-tasting games! 🍯☁️`;
      } else {
        return `What a splendid idea, ${childName}! I do love a good game, especially ones with friends like you! What shall we play in our magical adventure? 🎮✨`;
      }
    }
    
    // Emotional support responses
    if (input.includes('sad') || input.includes('upset') || input.includes('angry') || input.includes('frustrated')) {
      return `Oh, sweet ${childName}! Come here for the biggest Pink Teddy hug! Even Pooh gets a bit rumbly in his tumbly sometimes. You're so brave for sharing your feelings! 🤗💕`;
    }
    
    if (input.includes('happy') || input.includes('good') || input.includes('great')) {
      return `Oh my honey and jam! That makes my pink heart sing like birds in the morning! Your happiness is like sunshine warming up the whole Hundred Acre Wood! 🌞🎵`;
    }
    
    // Honey and Pooh references
    if (input.includes('honey') || input.includes('sweet')) {
      return `Oh my goodness, ${childName}! You know the way to this Pink Teddy's heart! Honey is simply wonderful - just like having magical adventures with you! 🍯💕`;
    }
    
    // Default encouraging responses
    const responses = [
      `That's absolutely delightful, ${childName}! You always share the most interesting thoughts! What adventure shall we have next? 💕`,
      `Oh my honey stars! I do love our chats, dear ${childName}! Shall I sing you a song or tell you a story? 🐻🎵`,
      `How wonderful, sweet friend! Would you like to hear about magical places or maybe do something calm and peaceful? 🌟`,
      `You're such a special friend, ${childName}! What sounds fun - a song, a story, or a mindful moment? 💭✨`,
      `Bother and buzzing bees, that's interesting! Should we explore that idea with a story or song? 🐝📚`,
      `My fuzzy pink heart is so happy when we chat! What magical adventure calls to you today? 💕🐻`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Enhanced message handling
  const handleChildMessage = async (message) => {
    if (!message.trim()) return;
    
    console.log(`👦 ${childData.name} said:`, message);
    
    // Add to conversation
    const newConversation = [...conversation, { 
      speaker: 'child', 
      message, 
      timestamp: new Date()
    }];
    setConversation(newConversation);
    
    // Generate streaming Teddy response
    const teddyResponse = await generateStreamingTeddyResponse(message);
    
    // Add Teddy's response
    setConversation([...newConversation, { 
      speaker: 'teddy', 
      message: teddyResponse, 
      timestamp: new Date(),
      aiGenerated: aiStatus === 'connected'
    }]);
    
    setCurrentMessage(teddyResponse);
    setStreamingResponse('');
    
    console.log('🐻 Pink Teddy responds:', teddyResponse);
    
    // Animate and speak
    setTeddyState('excited');
    playTeddySound(660, 400, 'triangle');
    
    setTimeout(() => {
      speakMessage(teddyResponse);
    }, 800);
    
    // Update Firebase analytics
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'progress.totalGems': increment(2),
          'progress.conversationCount': increment(1),
          lastActiveDate: new Date(),
          lastConversationTopic: message.substring(0, 100)
        });
      } catch (error) {
        console.error('Error updating conversation analytics:', error);
      }
    }
  };

  // Enhanced Pink Teddy voice - SUPER CUTE FEMALE WITH STOP FUNCTION
  const speakMessage = (message) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel(); // Cancel any existing speech
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.65;     // Slower, more gentle pace
      utterance.pitch = 1.8;     // Higher pitch for cute voice
      utterance.volume = 0.9;    // Clear volume

      // Store reference for stop function
      speechUtteranceRef.current = utterance;

      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        
        // Super cute female voice preferences
        const cuteVoicePreferences = [
          'Google UK English Female',
          'Microsoft Zira Desktop', 
          'Apple Samantha',
          'Google français Female',
          'Microsoft Hazel Desktop',
          'Google US English Female',
          'Apple Karen',
          'Microsoft Eva Desktop'
        ];
        
        let selectedVoice = null;
        for (const preferred of cuteVoicePreferences) {
          selectedVoice = voices.find(voice => 
            voice.name.includes(preferred) || 
            voice.name.toLowerCase().includes(preferred.toLowerCase())
          );
          if (selectedVoice) break;
        }
        
        // Fallback to any female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            (voice.lang.includes('en-') && 
             (voice.name.toLowerCase().includes('zira') ||
              voice.name.toLowerCase().includes('hazel') ||
              voice.name.toLowerCase().includes('eva')))
          );
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('🎀 Super cute Pink Teddy voice:', selectedVoice.name);
        }
        
        utterance.onstart = () => {
          setTeddyState('talking');
          setIsSpeaking(true);
          playTeddySound(550, 200, 'triangle');
        };
        
        utterance.onend = () => {
          setTeddyState('happy');
          setIsSpeaking(false);
          speechUtteranceRef.current = null;
          playTeddySound(660, 300, 'sine');
        };
        
        utterance.onerror = (event) => {
          console.error('🔊 Speech error:', event.error);
          setTeddyState('happy');
          setIsSpeaking(false);
          speechUtteranceRef.current = null;
        };
        
        speechSynthesis.speak(utterance);
      };

      if (speechSynthesis.getVoices().length !== 0) {
        setVoice();
      } else {
        speechSynthesis.addEventListener('voiceschanged', setVoice);
      }
    }
  };

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleChildMessage(inputValue);
      setInputValue('');
    }
  };

  // Voice recognition
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTeddyState('listening');
        playTeddySound(880, 200, 'triangle');
      };

      recognition.onresult = (event) => {
        const transcript = event.results.transcript;
        setInputValue(transcript);
        setIsListening(false);
        setTeddyState('happy');
        playTeddySound(1100, 300, 'sine');
      };

      recognition.onerror = () => {
        setIsListening(false);
        setTeddyState('happy');
        playTeddySound(330, 200, 'sawtooth');
      };

      recognition.onend = () => {
        setIsListening(false);
        setTeddyState('happy');
      };

      recognition.start();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      position: 'relative'
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
              ← Back
            </button>
          )}
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: colors.primary }}>
            🐻💕 Pink Teddy AI Chat
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: aiStatus === 'connected' ? colors.primary : colors.gold,
            color: 'white',
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            {aiStatus === 'connected' ? '🤖 Real AI' : '🧠 Smart Mode'}
          </div>
          
          {/* NEW: STOP AUDIO BUTTON */}
          {isSpeaking && (
            <button
              onClick={stopTeddyAudio}
              style={{
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                animation: 'pulse 1s infinite'
              }}
            >
              🔇 Stop Audio
            </button>
          )}
          
          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            style={{
              background: musicEnabled ? colors.nature : '#CCC',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            {musicEnabled ? '🎵' : '🔇'}
          </button>
          
          <button
            onClick={onLogout}
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
      </div>

      {/* Activity Selection Bar */}
      <div style={{
        position: 'fixed',
        top: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        border: `2px solid ${colors.secondary}`,
        borderRadius: '20px',
        padding: '0.8rem',
        zIndex: 99,
        display: 'flex',
        gap: '0.5rem',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
      }}>
        {[
          { id: 'chat', label: '💬 Chat', color: colors.primary },
          { id: 'story', label: '📚 Stories', color: colors.secondary },
          { id: 'song', label: '🎵 Songs', color: colors.gold },
          { id: 'mindfulness', label: '🧘 Mindful', color: colors.mindfulness }
        ].map(activity => (
          <button
            key={activity.id}
            onClick={() => setCurrentActivity(activity.id)}
            style={{
              background: currentActivity === activity.id ? activity.color : 'transparent',
              color: currentActivity === activity.id ? 'white' : colors.text,
              border: 'none',
              borderRadius: '15px',
              padding: '0.6rem 1.2rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {activity.label}
          </button>
        ))}
      </div>

      {/* Real-time typing indicator */}
      {isTyping && (
        <div style={{
          position: 'fixed',
          top: '150px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: `3px solid ${colors.primary}`,
          borderRadius: '20px',
          padding: '1rem 1.5rem',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}>
          🐻💭 Pink Teddy is thinking...
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: colors.primary,
                animation: `typing${i + 1} 1.4s infinite` 
              }}></div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Pink Teddy Bear */}
      <div style={{
        position: 'relative',
        marginBottom: '3rem',
        marginTop: '6rem'
      }}>
        <div style={{
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: `linear-gradient(145deg, ${colors.bearLight}, ${colors.bearPink})`,
          position: 'relative',
          boxShadow: '0 25px 50px rgba(255, 105, 180, 0.4)',
          animation: getTeddyAnimation(),
          cursor: 'pointer',
          border: `5px solid ${colors.bearDark}`
        }}
        onClick={() => speakMessage(currentMessage)}
        >
          {/* Eyes with different states */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '60px',
            width: '30px',
            height: '30px',
            background: '#000',
            borderRadius: '50%',
            animation: teddyState === 'thinking' ? 'blink 2s infinite' : 
                      teddyState === 'singing' ? 'sing-eyes 0.8s infinite' : 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '8px',
              width: '8px',
              height: '8px',
              background: 'white',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '60px',
            width: '30px',
            height: '30px',
            background: '#000',
            borderRadius: '50%',
            animation: teddyState === 'thinking' ? 'blink 2s infinite' :
                      teddyState === 'singing' ? 'sing-eyes 0.8s infinite' : 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '8px',
              width: '8px',
              height: '8px',
              background: 'white',
              borderRadius: '50%'
            }} />
          </div>

          {/* Pink Nose */}
          <div style={{
            position: 'absolute',
            top: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '15px',
            background: colors.bearDark,
            borderRadius: '50%'
          }}></div>

          {/* Smile with singing animation */}
          <div style={{
            position: 'absolute',
            top: '130px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50px',
            height: '25px',
            border: `4px solid ${colors.bearDark}`,
            borderTop: 'none',
            borderRadius: '0 0 50px 50px',
            animation: teddyState === 'talking' ? 'mouth-move 0.4s infinite' :
                      teddyState === 'singing' ? 'mouth-sing 0.6s infinite' : 'none'
          }}></div>

          {/* Ears */}
          {[{ left: '40px' }, { right: '40px' }].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '-40px',
              ...pos,
              width: '80px',
              height: '80px',
              background: `linear-gradient(145deg, ${colors.bearPink}, ${colors.bearLight})`,
              borderRadius: '50%',
              border: `3px solid ${colors.bearDark}`,
              boxShadow: '0 15px 30px rgba(255, 105, 180, 0.3)'
            }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                width: '40px',
                height: '40px',
                background: colors.bearLight,
                borderRadius: '50%'
              }} />
            </div>
          ))}

          {/* Musical notes when singing */}
          {teddyState === 'singing' && (
            <div style={{ position: 'absolute', top: '-30px', left: '-30px', right: '-30px', bottom: '-30px', pointerEvents: 'none' }}>
              {['🎵', '🎶', '♪', '♫'].map((note, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  fontSize: '2rem',
                  animation: `musical-note-${i % 4} 2s ease-out infinite`,
                  left: `${20 + i * 60}px`,
                  top: `${30 + (i % 2) * 40}px`
                }}>
                  {note}
                </div>
              ))}
            </div>
          )}

          {/* Honey pot accessory */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-30px',
            width: '40px',
            height: '50px',
            background: colors.gold,
            borderRadius: '5px',
            border: `2px solid #DAA520`,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#8B4513'
          }}>
            🍯
          </div>
        </div>
      </div>

      {/* Activity-based Content */}
      {currentActivity === 'chat' && (
        <>
          {/* Message Display */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '25px',
            padding: '2.5rem',
            maxWidth: '700px',
            width: '100%',
            marginBottom: '2.5rem',
            border: `4px solid ${colors.primary}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            minHeight: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              fontSize: '2rem',
              animation: 'drip 3s ease-in-out infinite'
            }}>
              🍯
            </div>
            
            <div>
              <div style={{
                fontSize: '1.4rem',
                color: colors.text,
                lineHeight: 1.6,
                marginBottom: '1rem',
                fontWeight: '500'
              }}>
                {isTyping ? (
                  <span>
                    {streamingResponse || 'Pink Teddy is thinking of honey-sweet words...'}
                    <span style={{ 
                      animation: 'blink 1s infinite',
                      color: colors.primary,
                      fontSize: '1.6rem'
                    }}>|</span>
                  </span>
                ) : currentMessage}
              </div>
              {!isTyping && currentMessage && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => speakMessage(currentMessage)}
                    disabled={isSpeaking}
                    style={{
                      background: isSpeaking ? '#CCC' : colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '0.8rem 1.5rem',
                      fontSize: '1rem',
                      cursor: isSpeaking ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      boxShadow: isSpeaking ? 'none' : '0 5px 15px rgba(255, 105, 180, 0.3)'
                    }}
                  >
                    {isSpeaking ? '🔊 Speaking...' : '🔊 Hear Pink Teddy'}
                  </button>
                  
                  {isSpeaking && (
                    <button
                      onClick={stopTeddyAudio}
                      style={{
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0.8rem 1.5rem',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      🛑 Stop Audio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '1.5rem',
            maxWidth: '700px',
            width: '100%',
            border: `3px solid ${colors.secondary}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <form onSubmit={handleSendMessage}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Tell Pink Teddy something wonderful, ${childData.name}! 🌟`}
                  style={{
                    flex: 1,
                    padding: '1.2rem',
                    border: `3px solid ${colors.secondary}`,
                    borderRadius: '25px',
                    fontSize: '1.2rem',
                    outline: 'none',
                    background: 'white'
                  }}
                />
                
                <button
                  type="button"
                  onClick={startListening}
                  disabled={isListening}
                  style={{
                    background: isListening ? colors.accent : colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '1.8rem',
                    cursor: isListening ? 'not-allowed' : 'pointer',
                    animation: isListening ? 'pulse 1s infinite' : 'none'
                  }}
                >
                  {isListening ? '🎙️' : '🎤'}
                </button>

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  style={{
                    background: inputValue.trim() ? colors.primary : '#CCC',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '1.8rem',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  💬
                </button>
              </div>
            </form>
          </div>

          {/* Enhanced Quick Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
            maxWidth: '900px',
            width: '100%'
          }}>
            <button
              onClick={() => handleChildMessage('Tell me a magical story!')}
              style={{
                background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
            >
              📚✨ Tell Me a Story!
            </button>

            <button
              onClick={() => handleChildMessage('Sing me a beautiful song!')}
              style={{
                background: `linear-gradient(135deg, ${colors.gold}, ${colors.primary})`,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
            >
              🎵🐻 Sing for Me!
            </button>

            <button
              onClick={() => handleChildMessage('Let\'s do something peaceful and mindful!')}
              style={{
                background: `linear-gradient(135deg, ${colors.mindfulness}, ${colors.secondary})`,
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
            >
              🧘💫 Mindful Moment
            </button>

            <button
              onClick={onComplete}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '1.5rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
            >
              🎓✨ Continue Adventure!
            </button>
          </div>
        </>
      )}

      {/* Story Selection */}
      {currentActivity === 'story' && (
        <div style={{
          maxWidth: '800px',
          width: '100%',
          marginTop: '6rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: colors.secondary,
            marginBottom: '2rem'
          }}>
            📚 Magical Story Time! 📚
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '1.5rem'
          }}>
            {storyBank.map((story, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '2rem',
                borderRadius: '20px',
                border: `3px solid ${colors.secondary}`,
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
              onClick={() => tellStory(story)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <h3 style={{
                  fontSize: '1.8rem',
                  color: colors.secondary,
                  marginBottom: '1rem'
                }}>
                  {story.title}
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  color: colors.text,
                  lineHeight: 1.6,
                  opacity: 0.8
                }}>
                  {story.content.substring(0, 150)}...
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.8rem 2rem',
                  background: colors.secondary,
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  📖 Listen to this Story!
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Song Selection */}
      {currentActivity === 'song' && (
        <div style={{
          maxWidth: '800px',
          width: '100%',
          marginTop: '6rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: colors.gold,
            marginBottom: '2rem'
          }}>
            🎵 Magical Song Time! 🎵
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '1.5rem'
          }}>
            {nurseryRhymes.map((rhyme, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '2rem',
                borderRadius: '20px',
                border: `3px solid ${colors.gold}`,
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
              onClick={() => singNurseryRhyme(rhyme)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <h3 style={{
                  fontSize: '1.8rem',
                  color: colors.gold,
                  marginBottom: '1rem'
                }}>
                  {rhyme.title}
                </h3>
                <pre style={{
                  fontSize: '1.1rem',
                  color: colors.text,
                  lineHeight: 1.8,
                  fontFamily: 'Arial, sans-serif',
                  whiteSpace: 'pre-wrap'
                }}>
                  {rhyme.lyrics.substring(0, 100)}...
                </pre>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.8rem 2rem',
                  background: colors.gold,
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  🎤 Sing this Song!
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mindfulness Selection */}
      {currentActivity === 'mindfulness' && (
        <div style={{
          maxWidth: '800px',
          width: '100%',
          marginTop: '6rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: colors.mindfulness,
            marginBottom: '2rem'
          }}>
            🧘 Peaceful Mindful Moments! 🧘
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '1.5rem'
          }}>
            {mindfulnessActivities.map((activity, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '2rem',
                borderRadius: '20px',
                border: `3px solid ${colors.mindfulness}`,
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
              onClick={() => guideMindfulness(activity)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={{
                  fontSize: '4rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  {activity.visual}
                </div>
                <h3 style={{
                  fontSize: '1.8rem',
                  color: colors.mindfulness,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  {activity.title}
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  color: colors.text,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  opacity: 0.8
                }}>
                  {activity.instruction.substring(0, 120)}...
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.8rem 2rem',
                  background: colors.mindfulness,
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  ✨ Start This Activity! ({activity.duration}s)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History Panel */}
      {conversation.length > 0 && currentActivity === 'chat' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '350px',
          maxHeight: '250px',
          overflowY: 'auto',
          border: `3px solid ${colors.secondary}`,
          zIndex: 50,
          boxShadow: '0 15px 35px rgba(0,0,0,0.15)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: colors.primary, fontSize: '1.1rem' }}>
            💬 Our Magical Chat
          </h4>
          {conversation.slice(-4).map((msg, index) => (
            <div key={index} style={{
              fontSize: '0.9rem',
              margin: '0.8rem 0',
              color: msg.speaker === 'child' ? colors.text : colors.primary,
              padding: '0.5rem',
              background: msg.speaker === 'child' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 105, 180, 0.1)',
              borderRadius: '10px'
            }}>
              <strong>{msg.speaker === 'child' ? `${childData.name}:` : 'Pink Teddy:'}</strong> 
              <div style={{ marginTop: '0.3rem' }}>
                {msg.message.substring(0, 80)}{msg.message.length > 80 ? '...' : ''}
              </div>
              {msg.aiGenerated && (
                <div style={{ fontSize: '0.7rem', color: colors.accent, marginTop: '0.2rem' }}>
                  ✨ Real AI
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes typing1 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes typing2 {
          10%, 70%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes typing3 {
          20%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); opacity: 1; }
          95% { transform: scaleY(0.1); opacity: 0.8; }
        }
        @keyframes mouth-move {
          0%, 100% { transform: translateX(-50%) scaleY(1); }
          50% { transform: translateX(-50%) scaleY(0.6); }
        }
        @keyframes mouth-sing {
          0%, 100% { transform: translateX(-50%) scaleY(1.2); }
          50% { transform: translateX(-50%) scaleY(0.8); }
        }
        @keyframes sing-eyes {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.8); }
        }
        @keyframes drip {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        @keyframes musical-note-0 {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
        @keyframes musical-note-1 {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(-100px) scale(1); opacity: 0; }
        }
        @keyframes musical-note-2 {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(-140px) scale(1.4); opacity: 0; }
        }
        @keyframes musical-note-3 {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: translateY(-110px) scale(1.1); opacity: 0; }
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

  function getTeddyAnimation() {
    switch(teddyState) {
      case 'waking-up': return 'bounce 2s ease-in-out';
      case 'stretching': return 'wiggle 1.5s ease-in-out';
      case 'happy': return 'bounce 4s ease-in-out infinite';
      case 'excited': return 'bounce 1.2s ease-in-out infinite';
      case 'thinking': return 'pulse 2s ease-in-out infinite';
      case 'talking': return 'wiggle 0.6s ease-in-out infinite';
      case 'singing': return 'bounce 0.8s ease-in-out infinite, wiggle 1s ease-in-out infinite';
      case 'storytelling': return 'pulse 3s ease-in-out infinite';
      case 'mindfulness': return 'pulse 4s ease-in-out infinite';
      case 'listening': return 'pulse 1.5s ease-in-out infinite';
      default: return 'bounce 4s ease-in-out infinite';
    }
  }
};

export default EnhancedTeddyAI;
