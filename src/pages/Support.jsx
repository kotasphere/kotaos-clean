
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageSquare, Book, HelpCircle, Send, CheckCircle } from "lucide-react";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      question: "How do I get started with KOTA OS?",
      answer: "Simply sign up for a free Silver account to start using KOTA OS. You'll get access to the AI Assistant, Bill Tracking, and Learning Hub immediately. No credit card required!"
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes! You can change your plan at any time from Settings. Upgrades take effect immediately, and downgrades will apply at the end of your current billing cycle."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption, secure cloud infrastructure, and follow industry best practices. All data is encrypted both in transit and at rest. See our Privacy Policy for full details."
    },
    {
      question: "How does the AI Assistant work?",
      answer: "Our AI Assistant learns your patterns and preferences to provide personalized suggestions, automate routine tasks, and help you stay organized. It uses advanced language models while keeping your data private and secure."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! You can export all your data in JSON format from the Settings page. We believe in data portability and want you to always have access to your information."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through Stripe, our secure payment processor. More payment options coming soon!"
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us at kotasphere@gmail.com within 30 days of your purchase."
    },
    {
      question: "Can multiple people use KOTA OS?",
      answer: "The Platinum plan includes multi-user access, perfect for families or small teams. Each user gets their own account with private data, plus shared features for collaboration."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // Check if user is authenticated
      let isAuthenticated = false;
      try {
        const user = await base44.auth.me();
        isAuthenticated = !!user;
      } catch (error) {
        isAuthenticated = false;
      }

      if (isAuthenticated) {
        // User is logged in - send via integration
        await base44.integrations.Core.SendEmail({
          to: "kotasphere@gmail.com",
          subject: `Support Request: ${formData.subject}`,
          body: `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from KOTA OS Support Form
          `
        });

        // Send confirmation to user
        await base44.integrations.Core.SendEmail({
          to: formData.email,
          subject: "We received your support request - KOTA OS",
          body: `
Hi ${formData.name},

Thank you for contacting KOTA OS support! We've received your message and will respond within 24 hours.

Your request:
Subject: ${formData.subject}
${formData.message}

We're here to help!

Best regards,
The KOTA OS Team
kotasphere@gmail.com
          `
        });

        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        // User is not logged in - use mailto as fallback
        const mailtoLink = `mailto:kotasphere@gmail.com?subject=${encodeURIComponent(`Support Request: ${formData.subject}`)}&body=${encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from KOTA OS Support Form
        `)}`;
        
        window.location.href = mailtoLink;
        
        // Show success message
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error("Failed to send support request:", error);
      
      // Fallback to mailto if integration fails
      const mailtoLink = `mailto:kotasphere@gmail.com?subject=${encodeURIComponent(`Support Request: ${formData.subject}`)}&body=${encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from KOTA OS Support Form
      `)}`;
      
      window.open(mailtoLink, '_blank');
      alert('Failed to send message via the form. Opening your email client as a fallback. If it doesn\'t open automatically, please email us directly at kotasphere@gmail.com');
    } finally {
      setSending(false);
    }
  };

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
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" className="border-gray-700 text-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
            <span className="text-blue-300 text-sm font-semibold">💬 We're Here to Help</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Support Center
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get answers to your questions or reach out to our support team
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Email Support</CardTitle>
              <CardDescription className="text-gray-400">
                We typically respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:kotasphere@gmail.com"
                className="text-blue-400 hover:underline"
              >
                kotasphere@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">AI Assistant</CardTitle>
              <CardDescription className="text-gray-400">
                Get instant answers from our AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  try {
                    base44.auth.redirectToLogin(createPageUrl("Assistant"));
                  } catch {
                    window.location.href = createPageUrl("Home");
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Book className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Documentation</CardTitle>
              <CardDescription className="text-gray-400">
                Browse guides and tutorials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Send Us a Message
              </CardTitle>
              <CardDescription className="text-gray-400">
                Fill out the form below and we'll get back to you ASAP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400 mb-6">
                    We've received your request and will respond within 24 hours.
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Name</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="bg-gray-900/50 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Email</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="bg-gray-900/50 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Subject</label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help?"
                      className="bg-gray-900/50 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Message</label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your question or issue..."
                      className="bg-gray-900/50 border-gray-700 text-white h-32"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* FAQs */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-gray-300 mb-6">
            Our support team is available Monday-Friday, 9AM-5PM CST. For urgent issues outside business hours, 
            please email us at <a href="mailto:kotasphere@gmail.com" className="text-blue-400 hover:underline">kotasphere@gmail.com</a> and 
            mark your message as "Urgent."
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={createPageUrl("PrivacyPolicy")}>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                Privacy Policy
              </Button>
            </Link>
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
