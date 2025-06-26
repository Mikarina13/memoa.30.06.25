import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white overflow-y-auto"
    >
      
      <button
        onClick={() => navigate('/info')}
        className="fixed top-24 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
        Return
      </button>

      <div className="max-w-4xl mx-auto py-20 px-8 relative">
        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-[Orbitron] pt-8">
          Terms of Service
        </h1>
        
        <div className="space-y-12 pb-12">
          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Introduction & Acceptance of Terms</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                Welcome to MEMOĀ, a platform designed to help you craft, share, and experience digital legacies and memories. By accessing or using MEMOĀ ("the Service"), you agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p>
                These Terms of Service constitute a legally binding agreement between you and MEMOĀ. To use our services, you must be at least 18 years old or have obtained parental/guardian consent.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400 font-[Orbitron]">Description of Service</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>MEMOĀ provides the following core services:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>MEMOIR: Tools for crafting and preserving your digital legacy</li>
                <li>MEMORIA: AI-assisted reanimation of presences for remembrance</li>
                <li>MEMENTO: Immersive 3D spaces for exploring and experiencing memories</li>
              </ul>
              <p>We reserve the right to modify, update, or discontinue any aspect of our services at our discretion.</p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400 font-[Orbitron]">User Accounts & Responsibilities</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Account Security</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access or security breaches</li>
                  <li>You are responsible for all activities that occur under your account</li>
                </ul>
              </div>
              
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Prohibited Activities</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Unauthorized access or interference with our systems</li>
                  <li>Distribution of malware or harmful code</li>
                  <li>Impersonation of others or fraudulent activities</li>
                  <li>Violation of any applicable laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron]">User-Generated Content & Intellectual Property</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Content Ownership</h3>
                <p className="text-white/70 leading-relaxed">
                  You retain ownership of the content you create and upload. By submitting content, you grant MEMOĀ a limited, non-exclusive license to use, store, and display your content for service operation.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Content Responsibilities</h3>
                <p className="text-white/70 leading-relaxed">
                  You must have all necessary rights and permissions for any content you upload, including consent for using deceased individuals' data in MEMORIA.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-rose-400 font-[Orbitron]">MEMORIA-Specific Terms</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>For creating MEMORIA representations:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>You must have obtained all necessary legal rights and permissions</li>
                <li>AI-generated content is an interpretation, not an exact replication</li>
                <li>Use must be respectful and not defamatory</li>
                <li>MEMOĀ reserves the right to remove inappropriate content</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Disclaimers & Limitations</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>The Service is provided "as is" without warranties of any kind. We are not liable for:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Service interruptions or data loss</li>
                <li>Accuracy of AI-generated content</li>
                <li>User-generated content</li>
                <li>Third-party services or links</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-green-400 font-[Orbitron]">Termination</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>We may suspend or terminate your access to MEMOĀ:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>For violations of these Terms</li>
                <li>For illegal or harmful activities</li>
                <li>At our discretion with reasonable notice</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-cyan-400 font-[Orbitron]">Changes to Terms</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani]">
              <p>
                We may update these Terms of Service at any time. We will notify you of any changes via email or through the Service. Your continued use of MEMOĀ after such changes constitutes acceptance of the updated Terms.
              </p>
              <p className="mt-4">
                For questions about these Terms, please contact us at legal@memoa.com
              </p>
            </div>
          </section>
        </div>
        
        <Footer />
      </div>
    </motion.div>
  );
}