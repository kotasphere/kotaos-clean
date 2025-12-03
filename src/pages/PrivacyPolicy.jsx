
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ff92f4fc2f1b7aa86a06b2/4ecec0417_file_00000000f3f061f7ad85b20d3e55a74e.png" 
                alt="KOTA OS"
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                KOTA OS
              </span>
            </Link>
            <Button 
              onClick={() => window.location.href = createPageUrl("Home")}
              variant="outline" 
              className="border-gray-700 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to KOTA OS ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-white mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, profile photo</li>
                <li><strong>User Content:</strong> Tasks, events, contacts, bills, notes, assets, and other data you create within KOTA OS</li>
                <li><strong>Communication Data:</strong> Messages, support inquiries, feedback</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store full payment details)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Features used, time spent, interaction patterns</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> IP address, access times, pages viewed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Provide Services:</strong> Deliver, maintain, and improve KOTA OS features</li>
                <li><strong>AI Assistance:</strong> Power personalized AI recommendations and automation</li>
                <li><strong>Communication:</strong> Send notifications, updates, and support responses</li>
                <li><strong>Security:</strong> Detect fraud, abuse, and technical issues</li>
                <li><strong>Analytics:</strong> Understand usage patterns to improve our service</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest</li>
                <li><strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
                <li><strong>Regular Audits:</strong> Ongoing security assessments and updates</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on enterprise-grade cloud platforms (Base44, Supabase)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="mb-2"><strong>We do NOT sell your personal data.</strong> We may share information only in these limited circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our service (e.g., cloud hosting, payment processing, AI services)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. AI and Machine Learning</h2>
              <p>
                KOTA OS uses AI to provide personalized experiences and automation. Here's how we handle AI:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Data Processing:</strong> Your data may be processed by AI models to generate recommendations and insights</li>
                <li><strong>Learning:</strong> AI learns your patterns to improve suggestions (within your account only)</li>
                <li><strong>Third-Party AI:</strong> We use reputable AI providers (OpenAI, Anthropic) with strict data protection agreements</li>
                <li><strong>Control:</strong> You can disable AI features at any time in Settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in portable format (JSON)</li>
                <li><strong>Opt-Out:</strong> Control email notifications and marketing communications</li>
                <li><strong>Data Portability:</strong> Transfer your data to another service</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at: <strong className="text-blue-400">kotasphere@gmail.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide services. When you delete your account:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal data is deleted within 30 days</li>
                <li>Anonymized analytics data may be retained for improvement purposes</li>
                <li>Legal requirements may necessitate longer retention in specific cases</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p>
                KOTA OS is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p>
                Your data may be stored and processed in the United States or other countries where our service providers operate. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage and improve performance</li>
                <li>Provide personalized experiences</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, though some features may not work properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the new policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for material changes</li>
              </ul>
              <p className="mt-4">
                Your continued use of KOTA OS after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
              </p>
              <div className="bg-gray-900/50 p-6 rounded-lg mt-4 border border-gray-700">
                <p className="font-semibold text-white">KOTA OS Privacy Team</p>
                <p className="mt-2">Email: <a href="mailto:kotasphere@gmail.com" className="text-blue-400 hover:underline">kotasphere@gmail.com</a></p>
                <p className="mt-2">Support: <Link to={createPageUrl("Support")} className="text-blue-400 hover:underline">Help Center</Link></p>
              </div>
            </section>

            <section className="border-t border-gray-700 pt-6 mt-8">
              <h2 className="text-2xl font-bold text-white mb-4">GDPR & CCPA Compliance</h2>
              <p>
                For users in the European Union and California, we comply with GDPR and CCPA regulations. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to access and data portability</li>
                <li>Right to correction and deletion</li>
                <li>Right to opt-out of data sales (we don't sell data)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
                <li>Consent mechanisms for data collection and processing</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <Button 
              onClick={() => window.location.href = createPageUrl("Home")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
