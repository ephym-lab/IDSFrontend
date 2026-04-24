'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, BarChart3, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-600/50">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-slate-100">Network IDS Command Center</span>
          </div>
          <div className="flex items-center gap-3">

            <Link href="/auth/signin">
              <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Sign Up
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button> 
            </Link>
            <Link href="/help">
              <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50">
                Help
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-7xl mx-auto px-6 py-20 md:py-32"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"></div>
        </div>

        <motion.div variants={itemVariants} className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded-full text-blue-300 text-xs font-semibold">
              Enterprise-Grade Security
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-100 text-balance">
            Network Intrusion Detection & Monitoring
          </h1>
          <p className="text-xl text-slate-400 text-pretty">
            Real-time threat intelligence, comprehensive packet analysis, and advanced anomaly detection for enterprise networks.
          </p>

          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-semibold">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <FeatureCard
            icon={BarChart3}
            title="Real-time Dashboard"
            description="Live monitoring of network streams and threat metrics"
          />
          <FeatureCard
            icon={AlertTriangle}
            title="Alert Management"
            description="Intelligent alert aggregation with severity classification"
          />
          <FeatureCard
            icon={Zap}
            title="Traffic Analysis"
            description="Deep packet inspection with protocol identification"
          />
          <FeatureCard
            icon={Shield}
            title="Batch Processing"
            description="Upload and analyze PCAP files at scale"
          />
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-20 border-y border-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <motion.div variants={itemVariants} className="space-y-2">
            <p className="text-4xl font-bold text-blue-400">98.5%</p>
            <p className="text-slate-400">Detection Accuracy</p>
          </motion.div>
          <motion.div variants={itemVariants} className="space-y-2">
            <p className="text-4xl font-bold text-cyan-400">12,450</p>
            <p className="text-slate-400">Packets/Second</p>
          </motion.div>
          <motion.div variants={itemVariants} className="space-y-2">
            <p className="text-4xl font-bold text-emerald-400">24/7</p>
            <p className="text-slate-400">Continuous Monitoring</p>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-6 py-20"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-700 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-12 text-center space-y-6"
        >
          <h2 className="text-3xl font-bold text-slate-100">Ready to Secure Your Network?</h2>
          <p className="text-lg text-slate-400">
            Deploy the Network IDS Command Center today and gain full visibility into your network traffic.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-semibold">
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>Network IDS Command Center • Enterprise Security Infrastructure</p>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6 hover:border-slate-600 hover:bg-slate-800/70 transition-all group"
    >
      <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700/50 w-fit mb-4 group-hover:bg-blue-900/50 transition-colors">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </motion.div>
  )
}
