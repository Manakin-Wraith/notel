import React, { useState } from 'react';
import ChatPrototype from './ChatPrototype';

// Demo wrapper component to showcase the chat prototype
const ChatPrototypeDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Chat Feature Interactive Prototype
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Experience the social messaging interface designed for your Notion-inspired productivity app
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">✨ Prototype Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Real-time Messaging</h3>
                    <p className="text-gray-400 text-sm">Send and receive messages with typing indicators</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Presence Indicators</h3>
                    <p className="text-gray-400 text-sm">See who's online, away, or offline</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Group Chats</h3>
                    <p className="text-gray-400 text-sm">Multi-user conversations with member counts</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Unread Badges</h3>
                    <p className="text-gray-400 text-sm">Visual indicators for new messages</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Glassmorphism UI</h3>
                    <p className="text-gray-400 text-sm">Matches your existing Notion-inspired design</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-white font-medium">Responsive Layout</h3>
                    <p className="text-gray-400 text-sm">Optimized for desktop and mobile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">🎯 How to Test</h3>
            <div className="text-gray-400 text-sm space-y-2 text-left">
              <p>• Click on different conversations in the left panel</p>
              <p>• Type and send messages to see simulated responses</p>
              <p>• Notice the typing indicators and message animations</p>
              <p>• Observe the presence indicators (🟢 online, 🟡 away, 🔴 offline)</p>
              <p>• Check unread message badges on conversations</p>
            </div>
          </div>

          <button
            onClick={() => setShowDemo(true)}
            className="px-8 py-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors font-medium text-lg"
          >
            Launch Interactive Prototype →
          </button>

          <div className="mt-8 text-sm text-gray-500">
            <p>This prototype demonstrates the UI/UX design with mock data and simulated interactions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Exit Demo Button */}
      <button
        onClick={() => setShowDemo(false)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-black/50 backdrop-blur-xl border border-white/20 rounded-lg text-white hover:bg-black/70 transition-colors text-sm"
      >
        ← Exit Demo
      </button>
      
      {/* Chat Prototype */}
      <ChatPrototype />
    </div>
  );
};

export default ChatPrototypeDemo;
