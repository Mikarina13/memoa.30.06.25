import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function CommunityGuidelinesPage() {
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
          Community Guidelines
        </h1>
        
        <div className="space-y-12 pb-12">
          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron]">Our Philosophy</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>
                Welcome to MEMOĀ, a portal to digital eternity designed for crafting legacies, reviving cherished presences, and walking among echoes. Our community is built on the principles of empathy, respect, and the shared human need for remembrance and connection. These guidelines help us create and maintain a space where everyone feels safe, supported, and valued as they engage with memories and legacies. By using MEMOĀ, you agree to uphold these principles and guidelines.
              </p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Respect and Empathy Above All</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <ul className="list-disc list-inside space-y-2">
                <li>Be Kind and Considerate: Interact with others and the legacies shared on MEMOĀ with the utmost respect and sensitivity. Remember that many topics and profiles may involve deep personal emotions, grief, and remembrance.</li>
                <li>No Harassment or Bullying: Zero tolerance for harassment, threats, hate speech, shaming, or any form of bullying directed at other users, or in the representation of any individual within a MEMOIR or MEMORIA.</li>
                <li>Constructive Interaction: When interacting on MEMOĀ, aim for supportive, reflective interactions that add positive value to the shared space.</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400 font-[Orbitron]">Content Standards & Prohibited Content</h2>
            <p className="mb-4 text-white/80 font-[Rajdhani]">To ensure MEMOĀ remains a safe and respectful platform, the following content is strictly prohibited:</p>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <ul className="list-disc list-inside space-y-2">
                <li>Illegal Content: Anything that violates local, national, or international laws.</li>
                <li>Hate Speech & Discrimination: Content that promotes violence, incites hatred, or discriminates against individuals or groups based on race, ethnicity, national origin, religion, sexual orientation, gender identity, age, disability, or any other characteristic.</li>
                <li>Harassment & Threats: Abusive language, personal attacks, threats of violence, or any content intended to intimidate or cause distress.</li>
                <li>Impersonation: Impersonating another person, living or deceased (outside the understood "interpretation" framework of MEMORIA, and never for deceptive purposes).</li>
                <li>Graphic or Disturbing Content: Excessively violent, gory, or sexually explicit content that is not contextually appropriate for a platform of remembrance.</li>
                <li>Misinformation & Disinformation: Knowingly sharing false or misleading information, especially if intended to cause harm or deceive.</li>
                <li>Spam & Unsolicited Promotions: Unsolicited advertising, promotional materials, or repetitive content.</li>
                <li>Intellectual Property Infringement: Uploading or sharing content that you do not have the rights to use.</li>
                <li>Privacy Violations: Sharing private information about others without their explicit consent.</li>
              </ul>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400 font-[Orbitron]">Guidelines Specific to MEMOĀ Modules</h2>
            <div className="space-y-6 font-[Rajdhani]">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-blue-300">MEMOIR (Crafting Your Legacy):</h3>
                <p className="text-white/70 leading-relaxed">Authenticity: We encourage you to be authentic in crafting your MEMOIR. This is your space to define your digital afterimage.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3 text-purple-300">MEMORIA (Reviving Presences):</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Respect for the Deceased: All MEMORIA creations must be undertaken with profound respect for the individual being remembered and their loved ones.</li>
                  <li>Authorized Representation: You must have the necessary rights and consents to use the personal data of a deceased individual.</li>
                  <li>"Interpretation, Not Imitation": Remember that AI-generated presences are interpretations based on the data provided.</li>
                  <li>No Harmful or Disrespectful Tributes: Public tributes must not be defamatory, mocking, or created with an intent to cause distress.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3 text-cyan-300">MEMENTO (Walking Among Echoes):</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Respectful Exploration: When exploring MEMENTO spaces, treat each legacy with respect.</li>
                  <li>No Defacement: Do not attempt to disrupt, deface, or negatively impact the MEMENTO spaces created by others.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-amber-400 font-[Orbitron]">Reporting Violations</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>If you encounter content or behavior that violates these Community Guidelines or our Terms of Service, please use the reporting tools provided on the platform or contact us at support@memoa.com.</p>
              <p>Provide as much detail as possible to help us understand and address the issue.</p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-rose-400 font-[Orbitron]">Consequences of Violations</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>Violations of these Community Guidelines may result in:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>A warning</li>
                <li>Removal of content</li>
                <li>Temporary or permanent suspension of account access</li>
              </ul>
              <p>MEMOĀ reserves the right to determine the appropriate action based on the severity and nature of the violation.</p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 font-[Orbitron]">Our Commitment</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>MEMOĀ is committed to fostering a positive and respectful community. We will strive to enforce these guidelines fairly and consistently.</p>
              <p>While we may utilize automated tools and rely on community reporting, MEMOĀ does not typically pre-screen all user-generated content. We reserve the right to review and remove content that violates our policies.</p>
            </div>
          </section>

          <section className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-green-400 font-[Orbitron]">Updates to These Guidelines</h2>
            <div className="space-y-4 font-[Rajdhani] text-white/80">
              <p>These Community Guidelines may be updated from time to time to reflect the evolving nature of our platform and community. We will notify you of significant changes. Your continued use of MEMOĀ after such changes constitutes your acceptance of the new guidelines.</p>
              <p className="mt-4">Thank you for being a part of the MEMOĀ community and helping us create a meaningful space for remembrance and connection.</p>
            </div>
          </section>
        </div>
        
        <Footer />
      </div>
    </motion.div>
  );
}