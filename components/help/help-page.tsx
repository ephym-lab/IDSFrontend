'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, LifeBuoy, Info, CheckCircle2, ArrowLeft, BookOpen, Zap, Shield, BarChart3, Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function HelpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'faq' | 'guide' | 'features' | 'troubleshoot'>('guide')

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.email || !form.message) {
      toast.error('Email and message are required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error('Enter a valid email address')
      return false
    }
    return true
  }

  const handleContact = async () => {
    if (!validate()) return

    const subject = encodeURIComponent(`Support request from ${form.name || form.email}`)
    const body = encodeURIComponent(
      `${form.message}\n\n--\n${form.name ? `Name: ${form.name}\n` : ''}Email: ${form.email}`
    )

    setSending(true)
    try {
      window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`
      toast.success('Opening your email client...')
    } catch {
      toast.error('Could not open mail client')
    } finally {
      setSending(false)
    }
  }

  const faqItems = [
    {
      q: 'What is an IDS?',
      a: 'An Intrusion Detection System (IDS) monitors network traffic for suspicious activity and potential security threats. Our system uses machine learning to identify attacks in real-time.'
    },
    {
      q: 'How do I start a live capture?',
      a: 'Navigate to the "Live Capture" page and click the "Start Capture" button. The system will begin monitoring incoming network packets in real-time. You can stop anytime with the stop button.'
    },
    {
      q: 'What do the severity levels mean?',
      a: 'HIGH: Critical threats requiring immediate attention. MEDIUM: Suspicious activity that should be investigated. LOW: Potential issues but less urgent.'
    },
    {
      q: 'How are alerts generated?',
      a: 'Alerts are triggered when network traffic matches detected attack patterns. The system calculates a confidence score to help you prioritize responses.'
    },
    {
      q: 'Can I filter the reports?',
      a: 'Yes! Use the advanced filters on Reports, Alerts, Traffic, and Live Capture pages to search by IP, attack type, severity, confidence level, and more.'
    },
    {
      q: 'How do I export data?',
      a: 'On the Reports page, you can export data as CSV, JSON, or HTML report. The exports include your active filters and current analysis.'
    },
    {
      q: 'Is my data secure?',
      a: 'All network data is processed securely with strict access controls. Traffic logs are encrypted and retained according to your configuration.'
    },
    {
      q: 'How fast is support response?',
      a: 'Standard support: 24-48 hours. Critical security issues: <4 hours. Use the contact form below or email critical@ids.com for urgent matters.'
    },
  ]

  const guideSections = [
    {
      title: 'Dashboard Overview',
      icon: BarChart3,
      content: 'The dashboard provides real-time statistics of your network security status. View total traffic, active alerts, attack rates, and confidence metrics at a glance.'
    },
    {
      title: 'Alerts Management',
      icon: Shield,
      content: 'Monitor all detected threats with detailed information about each alert. Use filters to focus on high-priority threats. Sort by severity, confidence, or time.'
    },
    {
      title: 'Traffic Logs',
      icon: Radar,
      content: 'Review all network traffic with ML predictions. Identify normal vs attack traffic, analyze patterns, and export data for further investigation.'
    },
    {
      title: 'Live Capture',
      icon: Zap,
      content: 'Real-time packet capture and analysis. Watch threats as they happen, monitor throughput, and track attack distribution live.'
    },
    {
      title: 'Reports & Analytics',
      icon: BarChart3,
      content: 'Generate comprehensive security reports with charts, statistics, and threat analysis. Filter results and export in multiple formats.'
    },
    {
      title: 'Account & Settings',
      icon: Shield,
      content: 'Manage your profile, notification preferences, and system settings. Configure alert thresholds and data retention policies.'
    },
  ]

  const troubleshootItems = [
    {
      issue: 'Live capture not starting',
      solution: 'Check network permissions and ensure no other capture session is active. Refresh the page and try again.'
    },
    {
      issue: 'No alerts appearing',
      solution: 'Verify the system is capturing traffic and check filter settings. Ensure severity filters aren\'t excluding all alerts.'
    },
    {
      issue: 'Low confidence scores',
      solution: 'This is normal for new or unusual traffic patterns. The ML model improves over time. Check attack details for context.'
    },
    {
      issue: 'Export failed',
      solution: 'Ensure you have data to export and sufficient permissions. Try a different format (CSV, JSON, or HTML).'
    },
    {
      issue: 'Slow performance',
      solution: 'Reduce the data range or apply filters to limit records. Clear browser cache. Check your internet connection.'
    },
    {
      issue: 'Can\'t login',
      solution: 'Verify your credentials. Check if your account is active. Use "Forgot Password" to reset. Contact support if issues persist.'
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header with Back Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-cyan-400"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-3 rounded-2xl bg-cyan-500/10">
              <LifeBuoy className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Help & Support</h1>
              <p className="text-slate-400 text-sm mt-0.5">Guides, FAQs, and support resources</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap border-b border-slate-700/30">
          {(['guide', 'faq', 'features', 'troubleshoot'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-600 hover:text-slate-400'
              )}
            >
              {tab === 'guide' && '📖 Getting Started'}
              {tab === 'faq' && '❓ FAQs'}
              {tab === 'features' && '✨ Features'}
              {tab === 'troubleshoot' && '🔧 Troubleshooting'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Getting Started Guide */}
            {activeTab === 'guide' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    Getting Started with IDS
                  </h2>
                  <div className="space-y-4 text-sm text-slate-300">
                    <div>
                      <h3 className="font-semibold text-white mb-1">1. Dashboard Orientation</h3>
                      <p>Start at the dashboard to see your network's security status. Key metrics include total traffic, active alerts, attack rate, and model confidence.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">2. Review Alerts</h3>
                      <p>Check the Alerts page to review all detected threats. Each alert shows the attack type, source/destination IPs, severity level, and confidence score.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">3. Monitor Live Traffic</h3>
                      <p>Use Live Capture to watch network packets in real-time. This helps you understand patterns and respond to threats as they happen.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">4. Analyze Traffic Logs</h3>
                      <p>Review the Traffic Logs page to see all network activity with ML classifications. Filter by attack type, time range, or confidence level.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">5. Generate Reports</h3>
                      <p>Generate comprehensive reports with detailed analytics. Export data in CSV, JSON, or HTML format for documentation and compliance.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FAQ Section */}
            {activeTab === 'faq' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-2">
                    {faqItems.map((item, i) => (
                      <details key={i} className="group border border-slate-700/30 rounded-lg p-3 cursor-pointer hover:bg-slate-800/30 transition-colors">
                        <summary className="font-medium text-white flex items-center justify-between">
                          {item.q}
                          <Info className="w-4 h-4 text-slate-400 group-open:rotate-180 transition" />
                        </summary>
                        <p className="mt-3 text-sm text-slate-400">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Features Section */}
            {activeTab === 'features' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4"
              >
                {guideSections.map((section, i) => {
                  const Icon = section.icon
                  return (
                    <div key={i} className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
                          <Icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{section.title}</h3>
                          <p className="text-sm text-slate-400 mt-1">{section.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}

            {/* Troubleshooting Section */}
            {activeTab === 'troubleshoot' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Troubleshooting Guide</h2>
                  <div className="space-y-3">
                    {troubleshootItems.map((item, i) => (
                      <div key={i} className="border border-slate-700/30 rounded-lg p-3 hover:bg-slate-800/20 transition-colors">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          ⚠️ {item.issue}
                        </h4>
                        <p className="text-sm text-slate-400 mt-2">✓ {item.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Form */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3">Contact Support</h3>
              <p className="text-xs text-slate-500 mb-3">Need more help? Send us a message.</p>
              
              <div className="space-y-2">
                <Input
                  placeholder="Your name (optional)"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="text-xs"
                />
                <Textarea
                  placeholder="Describe your issue..."
                  rows={3}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                onClick={handleContact}
                disabled={sending}
                className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700 text-xs"
              >
                {sending ? (
                  'Sending...'
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> Send
                  </>
                )}
              </Button>
              <p className="text-[10px] text-slate-600 mt-2 text-center">support@ids.com</p>
            </div>

            {/* Resources */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4">
              <h3 className="text-white font-medium mb-3">Quick Links</h3>
              <ul className="text-xs text-slate-400 space-y-2">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">📚 Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">🔔 Release Notes</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">👥 Community Forum</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">🐛 Report Bug</a></li>
              </ul>
            </div>

            {/* Support Info */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4 text-xs text-slate-400">
              <h3 className="text-white font-medium mb-2">Support Hours</h3>
              <p>Mon–Fri • 08:00–18:00 (UTC)</p>
              <p className="mt-2">
                <span className="text-amber-400">🚨 Critical:</span>
                <br />
                <a href="mailto:critical@ids.com" className="text-amber-400 hover:underline">
                  critical@ids.com
                </a>
              </p>
            </div>

            {/* Tip */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-xs text-green-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p><strong>Pro Tip:</strong> Use filters on Reports, Alerts, and Traffic pages to focus on specific threats and save time.</p>
            </div>

            {/* Status */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-xs text-cyan-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>All systems operational. Latest update: v2.1.0</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
