import React from 'react';

const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: "Unified Workspace",
      description: "Everything in one place - notes, tasks, calendar, and projects",
      icon: "🏠"
    },
    {
      title: "Flexible Views",
      description: "Switch between editor, agenda, board, and calendar views instantly",
      icon: "🔄"
    },
    {
      title: "Smart Notifications",
      description: "Never miss important deadlines with intelligent reminders",
      icon: "🔔"
    },
    {
      title: "Beautiful Design",
      description: "Clean, dark interface that's easy on the eyes and distraction-free",
      icon: "✨"
    }
  ];

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why choose Notel?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built for modern productivity with the simplicity you love
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="text-3xl">{benefit.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Philosophy Section - Notion-inspired */}
        <div className="mt-24">
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-2xl font-medium text-white mb-6">
              Built on simplicity
            </h3>
            <p className="text-lg text-gray-300 mb-12 leading-relaxed">
              While others overwhelm with features, we focus on what matters: 
              <span className="text-white font-medium"> clarity, speed, and getting things done</span>.
            </p>
            
            {/* Minimalist Comparison */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
                <div className="flex-1 max-w-xs">
                  <div className="text-gray-400 text-sm font-medium mb-3">Other tools</div>
                  <div className="text-gray-300 space-y-2">
                    <div>Cluttered interfaces</div>
                    <div>Endless configuration</div>
                    <div>Feature overload</div>
                  </div>
                </div>
                
                <div className="hidden sm:block w-px h-16 bg-gray-700"></div>
                
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-center mb-3">
                    <img 
                      src="/ntl_logo.png" 
                      alt="Notel" 
                      className="h-5 w-auto mr-2"
                    />
                    <span className="text-blue-400 text-sm font-medium">Notel</span>
                  </div>
                  <div className="text-white space-y-2">
                    <div>Clean, focused design</div>
                    <div>Works immediately</div>
                    <div>Everything you need, nothing you don't</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t border-gray-800">
                <p className="text-sm text-gray-400 italic">
                  "The best tool is the one that gets out of your way"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
