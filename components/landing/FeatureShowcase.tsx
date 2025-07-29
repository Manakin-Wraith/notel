import React from 'react';

const FeatureShowcase: React.FC = () => {
  const features = [
    {
      title: "Write & Organize",
      description: "Rich text editor with blocks for seamless content creation",
      icon: "📝",
      demo: (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <div className="h-3 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="ml-6 space-y-1">
              <div className="h-2 bg-gray-600 rounded w-full"></div>
              <div className="h-2 bg-gray-600 rounded w-3/4"></div>
              <div className="h-2 bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Plan & Schedule",
      description: "Calendar and agenda views to keep you on track",
      icon: "📅",
      demo: (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-7 gap-1 text-xs">
            {Array.from({ length: 21 }, (_, i) => (
              <div key={i} className={`h-6 rounded ${i % 7 === 0 || i % 7 === 6 ? 'bg-gray-800' : 'bg-gray-700'} ${i === 10 ? 'bg-blue-600' : ''}`}></div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Track & Manage",
      description: "Kanban boards for visual project management",
      icon: "📋",
      demo: (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <div className="h-2 bg-red-600 rounded w-full"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-yellow-600 rounded w-full"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-green-600 rounded w-full"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Stay Focused",
      description: "Clean, distraction-free interface that adapts to your workflow",
      icon: "🎯",
      demo: (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-700 rounded w-20"></div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded"></div>
                <div className="w-2 h-2 bg-gray-600 rounded"></div>
                <div className="w-2 h-2 bg-blue-600 rounded"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-800 rounded"></div>
            <div className="h-1 bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Multiple views, powerful features, and a clean interface that gets out of your way
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 mb-4">{feature.description}</p>
              <div className="mt-4">
                {feature.demo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
