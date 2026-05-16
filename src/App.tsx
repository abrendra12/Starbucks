import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MessageCircle, ArrowRight, Star, Coffee, SlidersHorizontal, X } from 'lucide-react';
import { Drink, HeroContent, Offer, UserContext } from './types';

// --- COMPONENTS ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 sb-glass border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="w-10 h-10 bg-sb-green rounded-full flex items-center justify-center">
          <Coffee className="text-white w-6 h-6" />
        </div>
        <div className="hidden md:flex gap-6 font-bold uppercase tracking-widest text-xs">
          <a href="#" className="hover:text-sb-green">Menu</a>
          <a href="#" className="hover:text-sb-green">Rewards</a>
          <a href="#" className="hover:text-sb-green">Gift Cards</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-semibold hover:text-sb-green">Sign in</button>
        <button className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-gray-800 transition-all">Join now</button>
      </div>
    </div>
  </nav>
);

const Hero = ({ content }: { content: HeroContent | null }) => (
  <section className="pt-24 pb-12 px-6">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center bg-sb-light-green rounded-[40px] overflow-hidden min-h-[500px]">
      <div className="p-8 md:p-16 space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-5xl md:text-7xl text-sb-house-green italic"
        >
          {content?.headline || "Fall starts here."}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-sb-house-green/80 max-w-md"
        >
          {content?.subheading || "Experience the warmth of autumn with our handcrafted seasonal favourites."}
        </motion.p>
        <div className="flex flex-wrap gap-4 pt-4">
          <button className="sb-btn-primary">{content?.primary_cta || "Order Now"}</button>
          <button className="sb-btn-outline">{content?.secondary_cta || "Join Rewards"}</button>
        </div>
      </div>
      <div className="relative h-full min-h-[300px]">
        <img 
          src="https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=1200" 
          alt="Coffee Hero" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-transparent to-sb-light-green/20" />
      </div>
    </div>
  </section>
);

const DrinkFinder = ({ onSearch }: { onSearch: (query: string) => Promise<void> }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    await onSearch(query);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 mb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="text-sb-gold" />
          AI Drink Finder
        </h2>
        <p className="text-gray-500">Describe your mood, taste, or dietary needs.</p>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'something iced, not too sweet, with oat milk'"
          className="w-full h-16 pl-6 pr-16 rounded-full sb-card focus:ring-2 focus:ring-sb-green outline-none text-lg"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 w-12 h-12 bg-sb-green rounded-full flex items-center justify-center text-white hover:bg-sb-house-green transition-all"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

const SirenChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], context: { date: new Date().toISOString() } })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a bit of trouble connecting to the roast station. Try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-sb-green shadow-2xl rounded-full flex items-center justify-center text-white z-50 hover:scale-110 transition-transform"
      >
        {isOpen ? <X /> : <MessageCircle className="w-8 h-8" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50"
          >
            <div className="bg-sb-house-green p-6 text-white text-center rounded-b-3xl">
              <h3 className="font-bold text-lg">Siren Assistant</h3>
              <p className="text-xs opacity-70">24/7 Digital Barista</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  <Coffee className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Hi, I'm Siren! Ask me about the menu, rewards, or our history.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    m.role === 'user' ? 'bg-sb-green text-white rounded-tr-none' : 'bg-gray-100 text-sb-house-green rounded-tl-none'
                  }`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-gray-400 italic">Siren is typing...</div>}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Siren..."
                className="flex-1 bg-gray-50 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-sb-green"
              />
              <button 
                onClick={sendMessage}
                className="w-10 h-10 bg-sb-green rounded-full flex items-center justify-center text-white"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- MAIN APP ---

export default function App() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [searchResults, setSearchResults] = useState<Drink[]>([]);
  const [rankedOffers, setRankedOffers] = useState<string[]>([]);
  const [userContext] = useState<UserContext>({
    loyaltyTier: "Gold",
    topDrinks: ["Pumpkin Spice Latte", "Oat Milk Latte"],
    stars: 245
  });

  useEffect(() => {
    const init = async () => {
      // Load Hero
      const heroRes = await fetch('/api/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: "Autumn", drink: { name: "Pumpkin Spice Latte", description: "The seasonal icon." } })
      });
      setHero(await heroRes.json());

      // Load Ranked Offers
      const offersRes = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userContext })
      });
      const data = await offersRes.json();
      setRankedOffers(data.ranked_offer_ids);
    };
    init();
  }, []);

  const handleSearch = async (query: string) => {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: userContext })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <Navbar />
      
      <main>
        <Hero content={hero} />
        
        <DrinkFinder onSearch={handleSearch} />

        {/* Search Results Display */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <AnimatePresence mode="wait">
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {searchResults.map((drink) => (
                  <motion.div 
                    layoutId={drink.id}
                    key={drink.id} 
                    className="sb-card p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-sb-gold">{drink.category}</span>
                        {drink.confidence_score && (
                          <span className="text-[10px] bg-sb-accent px-2 py-0.5 rounded-full text-sb-house-green font-bold">
                            {(drink.confidence_score * 100).toFixed(0)}% Match
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{drink.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{drink.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {drink.tags.map(t => (
                          <span key={t} className="text-[10px] border px-2 py-0.5 rounded-full text-gray-400">#{t}</span>
                        ))}
                      </div>
                    </div>
                    <button className="mt-6 w-full sb-btn-primary py-2 text-sm">Select Drink</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Personalized Offers */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif italic text-sb-house-green">Personalized for You</h2>
              <p className="text-gray-500">Based on your recent visits to the roast station.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-sb-green block">{userContext.stars}</span>
              <span className="text-xs uppercase font-bold text-gray-400">Stars Balance</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {rankedOffers.map((id, index) => (
              <div key={id} className={`p-8 rounded-3xl ${index === 0 ? 'bg-sb-house-green text-white' : 'bg-white border text-sb-house-green'} flex flex-col justify-between shadow-sm relative overflow-hidden group`}>
                {index === 0 && <div className="absolute top-4 right-4 bg-sb-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Top Pick</div>}
                <div className="space-y-4">
                  <Star className={`${index === 0 ? 'text-sb-gold' : 'text-sb-green'}`} />
                  <h3 className="text-2xl font-bold">{id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                  <p className={`text-sm ${index === 0 ? 'opacity-70' : 'text-gray-500'}`}>Special offer curated by Siren based on your loyalty to lattes.</p>
                </div>
                <div className="mt-8 flex justify-between items-center">
                  <span className="text-sm font-bold underline cursor-pointer">View Details</span>
                  <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-2 ${index === 0 ? 'bg-sb-green' : 'bg-gray-100'}`}>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t text-sm text-gray-400 flex flex-col md:flex-row justify-between gap-8">
        <div className="flex gap-8">
          <a href="#" className="hover:text-sb-green">Privacy Policy</a>
          <a href="#" className="hover:text-sb-green">Terms of Service</a>
          <a href="#" className="hover:text-sb-green">Customer Service</a>
        </div>
        <p>© 2026 Starbucks Coffee Company. All rights reserved. Powered by Siren AI.</p>
      </footer>

      <SirenChat />
    </div>
  );
}
