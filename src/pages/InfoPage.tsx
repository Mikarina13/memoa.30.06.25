import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, Book, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function InfoPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white overflow-y-auto"
    >
      
      <button
        onClick={() => navigate('/')}
        className="fixed top-24 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
        Return
      </button>

      <div className="max-w-4xl mx-auto py-20 px-8 relative">
        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-[Orbitron] pt-8">
          About MEMOĀ
        </h1>

        <div className="flex justify-center gap-4 mb-12">
          <button 
            onClick={() => navigate('/community-guidelines')}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Book className="w-5 h-5" />
            <span className="font-[Rajdhani]">Community Guidelines</span>
          </button>
          <button 
            onClick={() => navigate('/privacy-policy')}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span className="font-[Rajdhani]">Privacy Policy</span>
          </button>
          <button 
            onClick={() => navigate('/terms-of-service')}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-green-400 hover:text-green-300 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="font-[Rajdhani]">Terms of Service</span>
          </button>
        </div>
        
        <div className="space-y-12 pb-12">
          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Our Vision</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                Welcome to MEMOĀ, a portal to digital eternity where your story and the essence of those you cherish can transcend time. In a world where so much of our lives is digital, we believe in creating meaningful ways to preserve, experience, and share these precious legacies.
              </p>
              <p>
                MEMOĀ is designed to be a revolutionary platform combining cutting-edge 3D visualization with secure, heartfelt remembrance. We are pioneering a new way to ensure that personal stories, wisdom, and identities are not just stored, but continue to resonate and connect across generations.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400 font-[Orbitron]">Features - Understanding the MEMOĀ Modules</h2>
            <div className="space-y-8 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">MEMOIR: Craft Your Digital Legacy</h3>
                <p className="text-white/70 leading-relaxed">
                  This is where your journey begins – a sacred, personal space to record your voice, share your authentic stories, and preserve the memories, images, and values that define you. Memoir is the foundation of your unique digital afterimage, a living mosaic of your essence.
                </p>
              </div>
              
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">MEMORIA: Revive What Once Breathed</h3>
                <p className="text-white/70 leading-relaxed">
                  A portal to gentle reanimation, Memoria allows you to reconnect with the essence of loved ones who have passed. Using the digital traces they left behind—voice notes, texts, photos—we help reconstruct a resonant presence through AI. It's not about exact imitation, but a heartfelt interpretation, allowing their guidance and laughter to be experienced anew. Built for love, powered by memory.
                </p>
              </div>
              
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-cyan-300">MEMENTO: Walk Among Echoes</h3>
                <p className="text-white/70 leading-relaxed">
                  Step into an immersive 3D gallery of lives remembered. Here, your "scroll becomes a stroll" as you explore the tribute gardens and encounter the preserved minds, curated media, and AI reflections of others who came before. Memento is more than memory; it's a space for communion and shared remembrance.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-emerald-300">Security: Protecting Your Legacy</h3>
                <p className="text-white/70 leading-relaxed">
                  Your memories and digital essence are invaluable. At MEMOĀ, we are committed to protecting your shared information with state-of-the-art encryption and robust security measures, ensuring your legacy remains safe and endures.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400 font-[Orbitron]">Getting Started with MEMOĀ</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80 leading-relaxed">
              <p>We're thrilled to have you join us on this journey. Here's how you can begin:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Explore: Take your time to navigate our immersive spaces. The main portal will guide you to MEMOIR, MEMORIA, and MEMENTO.</li>
                <li>Create: Start your MEMOIR to begin crafting your own digital legacy. Share your voice, your stories, your art, and the places and media you love.</li>
                <li>Remember: Consider creating a MEMORIA for a loved one, helping to preserve their unique presence for others to connect with.</li>
                <li>Connect: Visit MEMENTO to experience the legacies already shared and perhaps leave a thoughtful note in a Guestbook.</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron]">Our Philosophy</h2>
            <p className="text-lg text-white/80 leading-relaxed font-[Rajdhani]">
              At MEMOĀ, we believe in the power of memory to connect, heal, and inspire. Our use of AI is always guided by respect, aiming for authentic emotional resonance and heartfelt interpretation, especially within Memoria. We are dedicated to providing a platform that is not only technologically innovative but also deeply human and considerate of the profound emotions tied to remembrance and legacy.
            </p>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Project Status & Feedback</h2>
            <p className="text-lg text-white/80 leading-relaxed font-[Rajdhani]">
              MEMOĀ is currently in its foundational development stage, proudly presented as part of the Bolt.new Hackathon. We are passionately building towards our full vision. Your insights and feedback are invaluable to us during this journey.
            </p>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-green-400 font-[Orbitron]">Contact</h2>
            <p className="text-lg text-white/80 leading-relaxed font-[Rajdhani]">
              Have questions, suggestions, or just want to share your thoughts? We'd love to hear from you. Please reach out to our team at{' '}
              <a href="mailto:ava.dsa25@proton.me" className="text-blue-400 hover:text-blue-300 underline">
                ava.dsa25@proton.me
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://www.youtube.com/watch?v=tT0fwMpRTcI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-colors shadow-lg"
          >
            <PlayCircle className="w-6 h-6" />
            <span className="font-medium">Watch Our Introduction Video</span>
          </a>
        </div>
        
        <Footer />
      </div>
    </motion.div>
  );
}