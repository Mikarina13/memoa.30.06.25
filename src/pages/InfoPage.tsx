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

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-rose-400 font-[Orbitron]">Inspiration</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                When I first came across the Bolt.new hackathon, I saw an opportunity. Could I take a brand new idea from nothing to a finished product in just one month? No shortcuts. No recycling. Just raw inspiration… built under pressure. I was up for the challenge and decided to go full speed with it.
              </p>
              <p>
                The idea for Memoā came to life just five days before the hackathon began, a project born from scratch, from the most personal place possible.
              </p>
              <p>
                For twenty years, I worked in high-level, international hospitality — managing teams, running operations, living across four continents. But when AI started reshaping the world, I realized it was time to reshape my future too. So I made the jump.
              </p>
              <p>
                I settled down in Andalucía, Spain with my wife, founded AVA Digital in the U.S., and signed up for the EITCA/AI Academy Certification from the EU. Back to school, back to building. Learning AI, chasing freelance work to pay the bills, trying to turn ideas into products — that's my daily life now.
              </p>
              <p>
                Memoā is one of those products. Maybe the most meaningful one.
              </p>
              <p>
                Twelve years ago, I lost my mom. Overwhelmed by strangers sending messages to her Facebook after she passed, I deleted her profile. It felt right at the time. Now, I know it was a mistake.
              </p>
              <p>
                Today, all I have is a three-minute piano recording — the same song I used in the Memoā demo video. Inside it: just fifteen seconds of her voice, recorded right before she passed. I spent days isolating and cleaning that file, running it through AI tools like LALAL.ai, and finally uploading it to ElevenLabs, just to hear her voice again. I've been chasing the memory of it for over a decade now.
              </p>
              <p>
                The result? Already mind-blowing. Soon, I'll play that voice reading Le Petit Prince to my nephew, a little boy who never met his grandmother. I'm also waiting on old VHS gala tapes of my mom's shows, hoping to extract more of her voice. Once digitized, with ElevenLabs and the right data, I know we'll bring her voice back, clearly and fully.
              </p>
              <p>
                That personal moment… that need to bring memory back to life… that's Memoā.
              </p>
              <p>
                But Memoā couldn't be a typical tribute page. I wanted it to stand out, not just rethink how we navigate memory, but how we navigate the web itself.
              </p>
              <p>
                A few days before deciding to enter the hackathon, I came across a post on X about a racing game built entirely in Three.js and React (R3F). No physics engines. No raycasts. Just pure 3D web space… built for vibes.
              </p>
              <p>
                It opened my eyes. That same lightweight, immersive tech — paired with AI and vibe coding — could be used for something deeper. Not just entertainment… but memory.
              </p>
              <p>
                I'd already built successful, paid projects with Bolt. I knew their tools could help turn vision into reality. With Memoā, I pushed it further.
              </p>
              <p>
                Memoā is a first-person, 3D space where presence, story, and legacy come together. You don't scroll through memories — you move through them. Explore them. Preserve them. For the people you love… and the generations still to come.
              </p>
              <p>
                It started as a tribute to my mom. But Memoā is for anyone who believes presence doesn't have to fade… and memory doesn't have to be flat.
              </p>
              <p>
                And today's AI tools can help revive so much more — voices, images, videos, stories. Memoā highlights some of the most powerful tools available, and I'll keep adding the best as this space evolves.
              </p>
              <p>
                I wanted to push myself, test myself, expose myself. And I thank Bolt.new for giving me the space and the tools to do exactly that.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">The Future of Memoā</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                Memoā started as a tribute to my mom. But it was never meant to stop there. From day one, the vision has been bigger — a full ecosystem to preserve, explore, and experience memory in new ways.
              </p>
              <p>
                Here's where Memoā is headed:
              </p>

              <div className="space-y-6 mt-6">
                <div className="p-6 bg-white/5 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-indigo-300">1. Memorandum – Secure Your Eternal Archives</h3>
                  <p className="text-white/70 mb-2">
                    The fourth core module of Memoā is coming: Memorandum, your private, encrypted digital vault.
                  </p>
                  <p className="text-white/70 mb-2">
                    <span className="text-indigo-300">🔒 What it is:</span> A secure space for your most valuable digital assets — beyond memories. Original music, personal photos, crypto keys, important documents, even your digital will… all safely stored, private, and transferable according to your wishes.
                  </p>
                  <p className="text-white/70">
                    <span className="text-indigo-300">💡 The Goal:</span> True digital sovereignty. Your legacy, protected, controlled by you. Future subscription plans will support expanded storage options for Memorandum.
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-purple-300">2. Live Memento Spaces – Where Legacy Becomes Community</h3>
                  <p className="text-white/70 mb-2">
                    Today, Memento lets you explore immersive, 3D memory spaces. But next? We're making it social.
                  </p>
                  <p className="text-white/70 mb-2">
                    <span className="text-purple-300">🌐 What it is:</span> Real-time, shared Memento spaces. Multi-room, dynamic environments where users can connect, talk, and experience legacies together using personalized live avatars.
                  </p>
                  <p className="text-white/70">
                    <span className="text-purple-300">💡 The Goal:</span> Legacy shouldn't be static. We'll use platforms like Ready Player Me to bring your avatar into live Memoā spaces — turning memory into shared presence.
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-cyan-300">3. Fully Personalized Worlds – Your Space, Your Rules</h3>
                  <p className="text-white/70 mb-2">
                    This one's personal. I don't want Memento to look the same for everyone.
                  </p>
                  <p className="text-white/70 mb-2">
                    <span className="text-cyan-300">🎨 What it is:</span> Like building in Minecraft — but for memory. Insert your own 3D models, change the backgrounds, AI-generate unique elements. Make your Memento truly your own.
                  </p>
                  <p className="text-white/70">
                    <span className="text-cyan-300">💡 The Goal:</span> No two Mementos should ever be the same. Your tribute space should reflect your creativity, personality, and legacy.
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-emerald-300">4. Ultimate Data Sovereignty – Own Your Legacy</h3>
                  <p className="text-white/70 mb-2">
                    Memoā's long-term future gives users total control.
                  </p>
                  <p className="text-white/70 mb-2">
                    <span className="text-emerald-300">💾 What it is:</span> Host your Memoā space locally or on private servers with affordable hardware — no dependence on centralized platforms.
                  </p>
                  <p className="text-white/70">
                    <span className="text-emerald-300">💡 The Goal:</span> Your memories, your rules. Maximum privacy, maximum longevity. A bold step toward true digital independence.
                  </p>
                </div>

                <div className="p-6 bg-white/5 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-amber-300">5. A Sustainable Future – Built to Last for Generations</h3>
                  <p className="text-white/70 mb-2">
                    Memoā is more than a project — it's designed to endure.
                  </p>
                  <p className="text-white/70 mb-2">
                    <span className="text-amber-300">💡 What it is:</span> Flexible pricing options to keep Memoā thriving:
                  </p>
                  <ul className="text-white/70 space-y-1 ml-6">
                    <li>✔️ Tiered Subscriptions: Unlock advanced features, storage, and space customization.</li>
                    <li>✔️ Usage-Based Pricing: Fair costs for resource-intensive AI tools like ElevenLabs voice generation.</li>
                    <li>✔️ One-Time Legacy Fees: Optional upgrades for permanent Memento spaces or premium Memoria profiles.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-6">
                Memoā was born from personal loss — but it's built for anyone who believes presence shouldn't fade, and memory doesn't have to be flat.
              </p>
              <p>
                This is just the beginning.
              </p>
            </div>
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