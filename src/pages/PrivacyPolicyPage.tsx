import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        
        <div className="space-y-12 pb-12">
          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Introduction</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                This Privacy Policy describes how MEMOĀ collects, uses, shares, and protects personal information when you use our platform and services. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p>
                By using MEMOĀ, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400 font-[Orbitron]">Information We Collect</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Information You Provide Directly</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Account Registration: Name, email address, password</li>
                  <li>MEMOIR Content: Text, voice recordings, photos, videos, music preferences, locations</li>
                  <li>MEMORIA Content: Digital traces of deceased individuals (with authorization)</li>
                  <li>MEMENTO Interactions: Guestbook messages, comments, saved spaces</li>
                  <li>Communications: Feedback, support requests, survey responses</li>
                </ul>
              </div>
              
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Information We Collect Automatically</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Usage Data: Feature usage, pages visited, time spent, interactions</li>
                  <li>Log Data: IP address, browser type, operating system, access times</li>
                  <li>Device Information: Device type, unique identifiers</li>
                  <li>Cookies and Similar Technologies: For session management and analytics</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400 font-[Orbitron]">How We Use Your Information</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Service Provision</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Create and manage user accounts</li>
                  <li>Enable MEMOIR and MEMORIA content creation</li>
                  <li>Facilitate MEMENTO space interactions</li>
                  <li>Process data through AI services for voice synthesis</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Platform Improvement</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Analyze usage patterns to enhance features</li>
                  <li>Troubleshoot technical issues</li>
                  <li>Develop new functionality</li>
                  <li>Ensure platform security</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-cyan-300">Communication</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Send service-related announcements</li>
                  <li>Provide security alerts</li>
                  <li>Respond to support requests</li>
                  <li>Share platform updates</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron]">How We Share Your Information</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">With Other Users</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>MEMOIR content remains private unless shared</li>
                  <li>MEMORIA content visibility is controlled by creators</li>
                  <li>MEMENTO space interactions may be visible to visitors</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Service Providers</h3>
                <p className="text-white/70 leading-relaxed">
                  We share information with third-party vendors who help us operate our platform, including cloud hosting, AI services, and analytics providers. These providers are given access only as necessary and are obligated to protect your information.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-rose-400 font-[Orbitron]">Data Security</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani] space-y-4">
              <p>
                We implement robust security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication</li>
                <li>Regular security audits</li>
                <li>Secure data storage via Supabase</li>
              </ul>
              <p className="text-white/60 italic">
                While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Your Rights and Choices</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access and review your personal information</li>
                <li>Update or correct your information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Control cookie preferences</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-green-400 font-[Orbitron]">Changes to This Policy</h2>
            <div className="text-lg text-white/80 leading-relaxed font-[Rajdhani]">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Modified" date.
              </p>
              <p className="mt-4">
                For questions about this Privacy Policy, please contact us at privacy@memoa.com
              </p>
            </div>
          </section>
        </div>
        
        <Footer />
      </div>
    </motion.div>
  );
}