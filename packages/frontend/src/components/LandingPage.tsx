'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  BarChart3,
  FileText,
  Star,
  Users,
  Building2,
  ShoppingCart,
  Bell,
  Sparkles
} from 'lucide-react';

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Construction Assistant</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Your AI Assistant for Construction Pricing
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Ask anything. Get instant answers with real-time supplier prices. 
              <br className="hidden sm:block" />
              No phone calls. No manual work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-12">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-base sm:text-lg px-8 py-6 h-auto font-semibold shadow-lg"
                onClick={() => router.push('/auth/register-simple')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white !text-white bg-transparent hover:bg-white/10 text-base sm:text-lg px-8 py-6 h-auto font-semibold"
                onClick={() => router.push('/auth/demo')}
              >
                Try Demo
              </Button>
            </div>
            
            {/* AI Chat Preview */}
            <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-xl p-4 sm:p-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">You</div>
                    <div className="text-sm text-gray-500">Just now</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-800">What's the price of cement?</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AI Assistant</div>
                    <div className="text-sm text-gray-500">Just now</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                  <p className="text-gray-800 mb-3">Based on current supplier data:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Supplier A: Cement</span>
                      <span className="font-semibold text-blue-600">$50/bag</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Supplier B: Cement</span>
                      <span className="font-semibold text-blue-600">$48/bag</span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                      <span className="font-semibold text-gray-900">Best Price:</span>
                      <span className="font-bold text-green-600">$48/bag from Supplier B</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              The Problem We Solve
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Construction professionals waste hours daily on manual work. We eliminate that.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* QS Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For QS Professionals</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">2-3 hours daily calling suppliers</p>
                    <p className="text-gray-600 text-sm">Manual quote preparation takes hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">No real-time price visibility</p>
                    <p className="text-gray-600 text-sm">Phone tag and follow-ups waste time</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Instant answers via AI</p>
                      <p className="text-gray-600 text-sm">Get real-time prices in seconds, not hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Suppliers</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Constant phone calls interrupt workflow</p>
                    <p className="text-gray-600 text-sm">Manual quote preparation is time-consuming</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">No visibility into market demand</p>
                    <p className="text-gray-600 text-sm">Price updates require calling every customer</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Update prices via AI chat</p>
                      <p className="text-gray-600 text-sm">Reach all QS professionals automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your workflow
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ask</h3>
              <p className="text-gray-600">
                Type your question in natural language, just like ChatGPT
              </p>
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 italic">"What's the price of cement?"</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Get Answers</h3>
              <p className="text-gray-600">
                AI shows real-time prices from all suppliers instantly
              </p>
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Best Price:</span> $48/bag
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Take Action</h3>
              <p className="text-gray-600">
                Generate quotes, manage projects, place orders
              </p>
              <div className="mt-6 bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Quote Generated</span> ✓
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline construction pricing
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Chat</h3>
              <p className="text-gray-600">
                Natural language interface. Ask anything, get instant answers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Prices</h3>
              <p className="text-gray-600">
                Always current supplier data. No stale information.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Quotes</h3>
              <p className="text-gray-600">
                Generate professional quotes in seconds, not hours.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project Management</h3>
              <p className="text-gray-600">
                Manage projects end-to-end with complete workflows.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supplier Ratings</h3>
              <p className="text-gray-600">
                Rate suppliers after orders. Make informed decisions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Alerts</h3>
              <p className="text-gray-600">
                Get notified of price changes, quotes, and updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for Everyone in Construction
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              One platform. Two user types. Infinite possibilities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* QS Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 sm:p-10 border-2 border-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Quantity Surveyors</h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Get instant price quotes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Generate professional quotes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Manage projects end-to-end</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Compare suppliers easily</span>
                </li>
              </ul>
              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/auth/register-simple')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Supplier Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 sm:p-10 border-2 border-purple-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Update prices via AI chat</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Reach all QS professionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No phone calls, no manual quotes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Real-time visibility to all customers</span>
                </li>
              </ul>
              <Button 
                size="lg" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => router.push('/auth/register-simple')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Construction Professionals
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "This saved me 3 hours daily. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">John D.</p>
                  <p className="text-sm text-gray-600">QS Professional</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Finally, a platform that understands our needs."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-600">Supplier</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The AI chat is incredible. It's like having an assistant that never sleeps."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Mike R.</p>
                  <p className="text-sm text-gray-600">QS Professional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">QS Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10">
            Join thousands of QS professionals and suppliers who are already saving time and money.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 text-base sm:text-lg px-8 py-6 h-auto font-semibold shadow-lg"
              onClick={() => router.push('/auth/register-simple')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10 text-base sm:text-lg px-8 py-6 h-auto font-semibold"
              onClick={() => router.push('/docs')}
            >
              View Documentation
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            💡 14-day free trial. No credit card required.
          </p>
        </div>
      </section>
    </div>
  );
}
