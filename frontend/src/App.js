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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
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
              <span className="text-sm text-gray-600">24/7 Support Available</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {activeTab === 'chat' && chatMessages.length === 0 && (
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 py-16">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <img 
              src="https://images.unsplash.com/photo-1464618663641-bbdd760ae84a" 
              alt="Peaceful mountain landscape"
              className="absolute inset-0 w-full h-full object-cover opacity-30 rounded-lg"
            />
            <div className="relative z-10 bg-white bg-opacity-90 rounded-lg p-8 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                You're Not Alone in This Journey
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Start a conversation with MindWell, your compassionate AI companion for mental health support
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  24/7 Available
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Confidential & Safe
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Evidence-Based Support
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
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
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div className="bg-white rounded-lg shadow-md border border-gray-200 h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to MindWell</h3>
                    <p className="text-gray-600 mb-4">
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
                          className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Share what's on your mind..."
                    disabled={isLoading}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
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
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
              />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">How are you feeling today?</h2>
              <p className="text-gray-600">Track your daily mood to identify patterns and celebrate progress</p>
            </div>

            {/* Mood Logger */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Log Today's Mood</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mood Level: {moodLevel}/10 {getMoodEmoji(moodLevel)}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodLevel}
                    onChange={(e) => setMoodLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Very Low</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={moodNotes}
                    onChange={(e) => setMoodNotes(e.target.value)}
                    placeholder="What's influencing your mood today? Any thoughts or events you'd like to note..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <button
                  onClick={logMood}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-lg font-medium transition-all"
                >
                  Log Mood Entry
                </button>
              </div>
            </div>

            {/* Mood History */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Recent Mood History</h3>
              
              {moodHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No mood entries yet. Start logging to see your patterns!</p>
              ) : (
                <div className="space-y-3">
                  {moodHistory.slice(0, 10).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getMoodEmoji(entry.mood_level)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${getMoodColor(entry.mood_level)}`}>
                              {entry.mood_level}/10
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Resources</h2>
              <p className="text-gray-600">Evidence-based information and tools to support your mental wellness journey</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <div key={resource.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {resource.category.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
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
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Learn More
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
              />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Crisis Support</h2>
              <p className="text-gray-600">Immediate help is available. You are not alone.</p>
            </div>

            {/* Emergency Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">!</span>
                </div>
                <h3 className="text-lg font-semibold text-red-800">If you're in immediate danger</h3>
              </div>
              <p className="text-red-700 mb-4">
                If you are having thoughts of hurting yourself or others, please reach out for help immediately.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:911" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Call 911
                </a>
                <a href="tel:988" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Call 988 (Suicide Prevention)
                </a>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">24/7 Crisis Helplines</h3>
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
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                      </div>
                      <a
                        href={`tel:${contact.phone.replace(/[^\d]/g, '')}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium ml-4 transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Coping Strategies */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Immediate Coping Strategies</h3>
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
                  <div key={index} className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{strategy.title}</h4>
                    <p className="text-blue-800 text-sm">{strategy.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Remember</h3>
              <p className="text-green-800">
                You are valuable, you matter, and help is available. These difficult feelings will pass. 
                Reaching out for support is a sign of strength, not weakness.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">MindWell</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Your mental health companion - providing support, resources, and hope.
            </p>
            <p className="text-xs text-gray-500">
              This app provides general mental health information and support. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;