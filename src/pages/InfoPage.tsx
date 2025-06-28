import { motion } from 'framer-motion';
import { ArrowLeft, Book, Shield, FileText, Mail, Phone, MapPin, PlayCircle } from 'lucide-react';
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
        className="fixed top-8 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
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

        {/* YouTube Intro Video Section */}
        <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron] flex items-center gap-3">
            <PlayCircle className="w-7 h-7" />
            MEMOĀ Introduction
          </h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-black/50">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/tT0fwMpRTcI"
              title="MEMOA Introduction Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          <p className="text-white/70 mt-4 text-center font-[Rajdhani]">
            Watch this video to learn more about MEMOĀ and how it can help preserve your digital legacy.
          </p>
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
            <div className="space-y-6 text-white/80 leading-relaxed font-[Rajdhani]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-white/5 p-4 rounded-lg flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-white">Address</h3>
                      <p className="text-white/70">
                        AVA Digital L.L.C<br />
                        1603 Capitol Ave Ste 415<br />
                        Cheyenne WY 82001
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg flex-1">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-white">Phone</h3>
                      <p className="text-white/70">
                        +1(307) 313-5017
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="w-full">
                    <h3 className="font-medium text-white mb-3">Email</h3>
                    <p className="text-white/70 mb-4">
                      Have questions, suggestions, or just want to share your thoughts? We'd love to hear from you. Please reach out to our team using the button below.
                    </p>
                    <a 
                      href="mailto:ava.dsa25@proton.me" 
                      className="inline-flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors shadow-lg"
                    >
                      <Mail className="w-5 h-5" />
                      Send Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10 mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-400 font-[Orbitron]">Future Vision</h2>
          <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">MEMOĀ: The Future Vision of Digital Eternity</h3>
            
            <h4 className="text-lg font-semibold text-purple-400 mt-4">Our Guiding Principle: A Legacy for Generations</h4>
            <p>
              At its heart, MEMOĀ is built on a single, profound idea: your story deserves to transcend time. We envision a future where your great-grandchildren, in the year 2100, can step into a vibrant digital space and meet the person they only know from stories. A future where they can hear your voice, discover your passions, see the world through your eyes, and feel the resonance of the legacy you left behind. MEMOĀ is not just an archive; it is a living bridge across generations, designed to receive memories and transmit legacy.
            </p>
            
            <h4 className="text-lg font-semibold text-blue-400 mt-4">The Paradigm Shift: A Navigable, Immersive Web</h4>
            <p>
              MEMOĀ introduces a revolutionary way to interact with the digital world. We are moving beyond the flat, two-dimensional web of pages and scrolls into a fully immersive 3D environment that you can walk through, explore, and experience. This is a VR world without the headset.
            </p>
            <p>
              This new paradigm allows for entirely new ways of sharing, navigating, and building on the internet. Your digital life is no longer a timeline of posts but a spatial journey—a gallery of memories you can stroll through, a garden of echoes you can visit. The future of personal digital interaction is spatial, and MEMOĀ is at the forefront of this transformation.
            </p>
            
            <h4 className="text-lg font-semibold text-emerald-400 mt-4">Our Journey: Forged in a Hackathon</h4>
            <p>
              The current version of MEMOĀ was forged with passion and intensity during the Bolt.new World's Biggest Hackathon in June 2025. This crucible of innovation allowed us to rapidly build and validate the core functionalities of the platform. As such, the interface you see today is a powerful proof of concept—functional, clean, and ready for the incredible journey ahead. It is the solid foundation upon which we will build the future.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">The Roadmap Ahead: An Endless Horizon</h3>
            <p>
              The future of MEMOĀ is endless. Our modular structure allows for continuous evolution, with new features and deeper integrations planned as technology, especially AI, advances.
            </p>
            
            <h4 className="text-lg font-semibold text-amber-400 mt-4">1. The Memento Metaverse: Building Your World</h4>
            <p>
              In the near future, we will transform the Memento space into a fully customizable personal metaverse. Inspired by creative building platforms like Minecraft, every user will be given the tools to sculpt their own unique 3D world. You will be able to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Design Your Environment: Choose landscapes, architecture, and lighting to create an atmosphere that reflects your personality.</li>
              <li>Place "Memory Points": Intuitively place your saved memories—favorite songs, movie posters, photos, voice recordings, and quotes—as interactive objects within your world.</li>
              <li>Create a True "Tribute Garden": Build a space that is not just a profile, but a destination—a beautiful, explorable testament to a life lived.</li>
            </ul>
            
            <h4 className="text-lg font-semibold text-pink-400 mt-4">2. The Deepening Memoir: The Rise of the AI Twin</h4>
            <p>
              As AI develops, the options within Memoir and Memoria will expand, making your digital twin ever more authentic.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Interactive AI Personas: We envision a future where visitors can have simple, meaningful conversations with a digital twin. Imagine asking your ancestor's avatar, "Tell me about your favorite book," and hearing it respond in their own voice, synthesizing an answer from the narratives they saved.</li>
              <li>Advanced Personality Profiling: We will move beyond simple data collection to integrate more nuanced personality models, perhaps through optional questionnaires or deeper analysis of written works, to create an AI that truly captures the user's way of thinking.</li>
            </ul>
            
            <h4 className="text-lg font-semibold text-indigo-400 mt-4">3. The Unveiling of Memorandum: Your Digital Vault</h4>
            <p>
              A core part of our original vision, the Memorandum module will be a future priority.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Secure Your Eternal Archives: Memorandum will function as a secure, encrypted digital vault for your most important assets. This includes everything from family photo archives and personal manuscripts to cryptocurrency keys and other sensitive digital credentials. It is a legacy of data, protected with sovereignty and designed to be passed on.</li>
            </ul>
            
            <h4 className="text-lg font-semibold text-cyan-400 mt-4">4. Augmented Reality (AR) Integration:</h4>
            <p>
              In the more distant future, we aim to bridge the digital and physical worlds. Imagine using your phone to see a "memory point" in your real-world environment—a message from a loved one appearing in their favorite armchair, or a story appearing on the wall of your childhood home.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Our Community and Business Model</h3>
            <p>
              MEMOĀ is an open, evolving project. We are building this not just for our users, but <em>with</em> our users.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>An Open Community: Your feedback is the catalyst for our evolution. We will be implementing channels for our community to share ideas and help shape the future of the platform.</li>
              <li>Our Philosophy on Access: We believe that preserving a legacy is a fundamental need. Therefore, the core functionalities of MEMOĀ are, and will remain, free to use.</li>
              <li>Future Sustainability: To ensure MEMOĀ can serve generations for centuries to come, we will introduce premium features and partnerships. Our model will likely be a fair, transparent "pay-as-you-go" system using credits for advanced AI services (like extensive voice cloning or large-scale 3D space generation), allowing users to pay only for the resources they use.</li>
            </ul>
            
            <p className="mt-4 text-white font-medium">
              The future of memory is not about static archives; it's about dynamic, living legacies. We invite you to join us in building that future today.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </motion.div>
  );
}