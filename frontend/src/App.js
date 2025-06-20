import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [moodLevel, setMoodLevel] = useState(5);
  const [moodNotes, setMoodNotes] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const chatEndRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadResources();
    loadCategories();
    loadMoodHistory();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadResources = async (category = null) => {
    try {
      const url = category && category !== 'all' 
        ? `${API_BASE_URL}/api/resources?category=${category}`
        : `${API_BASE_URL}/api/resources`;
      const response = await fetch(url);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/resources/categories`);
      const data = await response.json();
      setCategories(['all', ...data.categories]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMoodHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mood/history`);
      const data = await response.json();
      setMoodHistory(data.mood_entries || []);
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        }),
      });

      const data = await response.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // Add AI response to chat
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const logMood = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_level: moodLevel,
          notes: moodNotes,
          activities: []
        }),
      });

      if (response.ok) {
        setMoodNotes('');
        setMoodLevel(5);
        loadMoodHistory();
        alert('Mood logged successfully!');
      }
    } catch (error) {
      console.error('Error logging mood:', error);
      alert('Error logging mood. Please try again.');
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    loadResources(category);
  };

  const getMoodEmoji = (level) => {
    const emojis = ['😢', '😔', '😐', '😊', '😄'];
    return emojis[Math.floor((level - 1) / 2)] || '😐';
  };

  const getMoodColor = (level) => {
    if (level <= 2) return 'text-red-500';
    if (level <= 4) return 'text-orange-500';
    if (level <= 6) return 'text-yellow-500';
    if (level <= 8) return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-pattern opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      {/* Header */}
      <header className="glass-header backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 glass-effect rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">Wandile MindWell</h1>
                <p className="text-sm text-white/80 drop-shadow-md">Mental Health Support and Resources</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-white/80 drop-shadow-md">24/7 Support Available</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {activeTab === 'chat' && chatMessages.length === 0 && (
        <div className="relative py-16">
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <img 
              src="https://images.unsplash.com/photo-1464618663641-bbdd760ae84a" 
              alt="Peaceful mountain landscape"
              className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-2xl"
            />
            <div className="relative z-10 glass-card backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                You're Not Alone in This Journey
              </h2>
              <p className="text-xl text-white/90 mb-6 drop-shadow-md">
                Start a conversation with your compassionate AI companion for mental health support
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
                <span className="flex items-center glass-pill px-4 py-2 rounded-full backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  24/7 Available
                </span>
                <span className="flex items-center glass-pill px-4 py-2 rounded-full backdrop-blur-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Confidential & Safe
                </span>
                <span className="flex items-center glass-pill px-4 py-2 rounded-full backdrop-blur-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                  Evidence-Based Support
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="glass-nav backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'chat', label: 'AI Companion', icon: '💬' },
              { id: 'mood', label: 'Mood Tracking', icon: '😊' },
              { id: 'resources', label: 'Resources', icon: '📚' },
              { id: 'crisis', label: 'Crisis Support', icon: '🆘' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="glass-container h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-lg">Welcome to Wandile MindWell</h3>
                    <p className="text-white/80 mb-4 drop-shadow-md">
                      I'm here to provide support, coping strategies, and a listening ear. How are you feeling today?
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      {[
                        "I'm feeling anxious about work",
                        "I need help with sleep issues",
                        "I want to learn coping strategies", 
                        "I'm having a difficult day"
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(suggestion)}
                          className="p-3 text-left glass-button rounded-lg text-sm text-white transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'chat-message-user'
                          : 'chat-message-ai'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-white">{message.content}</p>
                      <p className="text-xs mt-1 text-white/60">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="loading-glass px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="border-t border-white/20 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Share what's on your mind..."
                    disabled={isLoading}
                    className="flex-1 glass-input rounded-lg px-4 py-2 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="glass-button disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-2 drop-shadow-md">
                  Remember: This is for support and guidance. In crisis situations, please contact emergency services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mood Tracking Tab */}
        {activeTab === 'mood' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1488345979593-09db0f85545f" 
                alt="Person in peaceful water"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg border-4 border-white/30"
              />
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">How are you feeling today?</h2>
              <p className="text-white/80 drop-shadow-md">Track your daily mood to identify patterns and celebrate progress</p>
            </div>

            {/* Mood Logger */}
            <div className="glass-container p-6">
              <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-lg">Log Today's Mood</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Mood Level: {moodLevel}/10 {getMoodEmoji(moodLevel)}
                  </label>
                  <div className="mood-slider-glass p-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodLevel}
                      onChange={(e) => setMoodLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-white/70 mt-1">
                      <span>Very Low</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={moodNotes}
                    onChange={(e) => setMoodNotes(e.target.value)}
                    placeholder="What's influencing your mood today? Any thoughts or events you'd like to note..."
                    className="w-full glass-input rounded-lg px-3 py-2"
                    rows="3"
                  />
                </div>

                <button
                  onClick={logMood}
                  className="w-full glass-button py-3 rounded-lg font-medium"
                >
                  Log Mood Entry
                </button>
              </div>
            </div>

            {/* Mood History */}
            <div className="glass-container p-6">
              <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-lg">Recent Mood History</h3>
              
              {moodHistory.length === 0 ? (
                <p className="text-white/70 text-center py-8">No mood entries yet. Start logging to see your patterns!</p>
              ) : (
                <div className="space-y-3">
                  {moodHistory.slice(0, 10).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 glass-pill rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getMoodEmoji(entry.mood_level)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">
                              {entry.mood_level}/10
                            </span>
                            <span className="text-sm text-white/60">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-white/80 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Mental Health Resources</h2>
              <p className="text-white/80 drop-shadow-md">Evidence-based information and tools to support your mental wellness journey</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'glass-effect text-white'
                      : 'glass-pill text-white/70 hover:text-white'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <div key={resource.id} className="resource-card-glass rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block glass-pill text-white/90 text-xs px-2 py-1 rounded-full">
                      {resource.category.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-md">{resource.title}</h3>
                  <p className="text-white/80 text-sm mb-4">{resource.description}</p>
                  
                  <div className="glass-pill rounded-lg p-4 mb-4">
                    <p className="text-sm text-white/90 leading-relaxed">
                      {resource.content.length > 200 
                        ? `${resource.content.substring(0, 200)}...` 
                        : resource.content
                      }
                    </p>
                  </div>
                  
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-white hover:text-white/80 text-sm font-medium"
                    >
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Support Tab */}
        {activeTab === 'crisis' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1465321897912-c692b37a09a6" 
                alt="Person by peaceful water"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg border-4 border-white/30"
              />
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Crisis Support</h2>
              <p className="text-white/80 drop-shadow-md">Immediate help is available. You are not alone.</p>
            </div>

            {/* Emergency Notice */}
            <div className="crisis-warning-glass rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/80 rounded-full flex items-center justify-center backdrop-blur-md">
                  <span className="text-white font-bold">!</span>
                </div>
                <h3 className="text-lg font-semibold text-white drop-shadow-lg">If you're in immediate danger</h3>
              </div>
              <p className="text-white/90 mb-4 drop-shadow-md">
                If you are having thoughts of hurting yourself or others, please reach out for help immediately.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:911" className="glass-button px-6 py-3 rounded-lg font-medium">
                  Call 911
                </a>
                <a href="tel:988" className="glass-button px-6 py-3 rounded-lg font-medium">
                  Call 988 (Suicide Prevention)
                </a>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="glass-container p-6">
              <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-lg">24/7 Crisis Helplines</h3>
              <div className="space-y-4">
                {[
                  {
                    name: "National Suicide Prevention Lifeline",
                    phone: "988",
                    description: "24/7 free and confidential support for people in distress"
                  },
                  {
                    name: "Crisis Text Line",
                    phone: "Text HOME to 741741",
                    description: "24/7 crisis support via text message"
                  },
                  {
                    name: "SAMHSA National Helpline",
                    phone: "1-800-662-4357",
                    description: "Treatment referral and information service"
                  },
                  {
                    name: "National Domestic Violence Hotline",
                    phone: "1-800-799-7233",
                    description: "24/7 confidential support for domestic violence survivors"
                  }
                ].map((contact, index) => (
                  <div key={index} className="glass-pill rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white drop-shadow-md">{contact.name}</h4>
                        <p className="text-sm text-white/80 mt-1">{contact.description}</p>
                      </div>
                      <a
                        href={`tel:${contact.phone.replace(/[^\d]/g, '')}`}
                        className="glass-button px-4 py-2 rounded-lg text-sm font-medium ml-4"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Coping Strategies */}
            <div className="glass-container p-6">
              <h3 className="text-xl font-semibold mb-4 text-white drop-shadow-lg">Immediate Coping Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "5-4-3-2-1 Grounding",
                    description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste"
                  },
                  {
                    title: "Deep Breathing",
                    description: "Breathe in for 4 counts, hold for 4, breathe out for 6. Repeat."
                  },
                  {
                    title: "Cold Water",
                    description: "Splash cold water on your face or hold ice cubes to interrupt intense emotions"
                  },
                  {
                    title: "Call Someone",
                    description: "Reach out to a trusted friend, family member, or counselor"
                  },
                  {
                    title: "Safe Space",
                    description: "Go to a place where you feel secure and comfortable"
                  },
                  {
                    title: "Write It Down",
                    description: "Journal your thoughts and feelings to help process them"
                  }
                ].map((strategy, index) => (
                  <div key={index} className="glass-pill rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2 drop-shadow-md">{strategy.title}</h4>
                    <p className="text-white/80 text-sm">{strategy.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center glass-container rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-lg">Remember</h3>
              <p className="text-white/90 drop-shadow-md">
                You are valuable, you matter, and help is available. These difficult feelings will pass. 
                Reaching out for support is a sign of strength, not weakness.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-glass border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 glass-effect rounded-full flex items-center justify-center">
                <span className="text-white font-bold">W</span>
              </div>
              <span className="text-lg font-semibold text-white drop-shadow-lg">Wandile MindWell</span>
            </div>
            <p className="text-white/80 text-sm mb-4 drop-shadow-md">
              Mental Health Support and Resources - providing support, resources, and hope.
            </p>
            <p className="text-xs text-white/60 drop-shadow-sm">
              This app provides general mental health information and support. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;