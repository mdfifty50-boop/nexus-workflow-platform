import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TutorialCard, FeaturedTutorial, DEFAULT_TUTORIALS } from '@/components/TutorialCard'

// =============================================================================
// HELP CENTER PAGE
// =============================================================================
// Comprehensive help center with FAQ, common issues, and contact info.
// Includes searchable help articles and video tutorial placeholders.
// =============================================================================

// FAQ Data
const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'workflows', label: 'Workflows', icon: '⚡' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
]

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-nexus',
    question: 'What is Nexus?',
    answer: 'Nexus is an AI-powered workflow automation platform that helps you automate repetitive tasks using intelligent agents. Unlike traditional automation tools, Nexus can understand context, make decisions, and adapt to changing situations.',
    category: 'getting-started',
    keywords: ['introduction', 'overview', 'what', 'about'],
  },
  {
    id: 'first-workflow',
    question: 'How do I create my first workflow?',
    answer: 'Go to the Dashboard and click "Create Workflow". You can either start from scratch using the visual builder or select a pre-built template. The wizard will guide you through connecting your apps and configuring the automation steps.',
    category: 'getting-started',
    keywords: ['create', 'first', 'new', 'start', 'begin'],
  },
  {
    id: 'templates-available',
    question: 'What templates are available?',
    answer: 'We offer templates for email automation, CRM updates, meeting scheduling, document processing, social media management, and more. Browse the Templates page to see all available options.',
    category: 'getting-started',
    keywords: ['templates', 'preset', 'examples', 'premade'],
  },
  // Workflows
  {
    id: 'workflow-triggers',
    question: 'What triggers can I use to start workflows?',
    answer: 'Workflows can be triggered by: scheduled times (cron), webhooks, email receipts, form submissions, API calls, or manual execution. You can also chain workflows together.',
    category: 'workflows',
    keywords: ['trigger', 'start', 'activate', 'schedule', 'webhook'],
  },
  {
    id: 'workflow-conditions',
    question: 'How do I add conditions to my workflow?',
    answer: 'Use the Condition node in the workflow builder. You can create if/then logic based on data values, comparison operators, and even AI-powered classification. Drag a condition node from the sidebar and configure the rules.',
    category: 'workflows',
    keywords: ['condition', 'if', 'logic', 'branch', 'filter'],
  },
  {
    id: 'workflow-testing',
    question: 'How do I test my workflow before going live?',
    answer: 'Use the "Test Run" button in the workflow builder. This executes the workflow with sample data and shows you each step\'s output. You can also view detailed logs in the Execution History.',
    category: 'workflows',
    keywords: ['test', 'debug', 'preview', 'dry run'],
  },
  // Integrations
  {
    id: 'supported-integrations',
    question: 'What apps can I connect?',
    answer: 'Nexus supports 500+ integrations including Gmail, Slack, Salesforce, HubSpot, Google Sheets, Notion, Zapier, and more. Visit the Integrations page to see the full list and connect your accounts.',
    category: 'integrations',
    keywords: ['apps', 'connect', 'integration', 'supported'],
  },
  {
    id: 'oauth-connection',
    question: 'How do I connect my accounts securely?',
    answer: 'We use OAuth 2.0 for secure authentication. Click "Connect" on any integration, and you\'ll be redirected to the app\'s login page. We never store your passwords - only secure access tokens with minimal required permissions.',
    category: 'integrations',
    keywords: ['oauth', 'security', 'login', 'connect', 'authentication'],
  },
  {
    id: 'custom-api',
    question: 'Can I connect custom APIs?',
    answer: 'Yes! Use the HTTP Request node to connect to any REST API. You can configure headers, authentication, request body, and map the response to workflow variables.',
    category: 'integrations',
    keywords: ['api', 'custom', 'http', 'rest', 'webhook'],
  },
  // Billing
  {
    id: 'pricing',
    question: 'How does pricing work?',
    answer: 'Nexus offers a free tier with limited executions, and paid plans based on workflow runs and AI token usage. Visit the Pricing page for detailed plan comparisons and current rates.',
    category: 'billing',
    keywords: ['price', 'cost', 'plan', 'subscription', 'free'],
  },
  {
    id: 'usage-tracking',
    question: 'How do I track my usage?',
    answer: 'View your usage dashboard in Settings > Billing. It shows workflow executions, AI token consumption, API calls, and estimated costs. You can also set up alerts for usage thresholds.',
    category: 'billing',
    keywords: ['usage', 'track', 'limit', 'consumption'],
  },
  // Troubleshooting
  {
    id: 'workflow-failed',
    question: 'My workflow failed - what should I do?',
    answer: 'Check the execution logs for error details. Common issues include: expired API tokens (reconnect the integration), rate limits (add delays between steps), or invalid data formats (check your transformations).',
    category: 'troubleshooting',
    keywords: ['failed', 'error', 'broken', 'not working', 'fix'],
  },
  {
    id: 'slow-execution',
    question: 'Why is my workflow running slowly?',
    answer: 'Execution speed depends on: API response times, AI model complexity, and the number of steps. Consider using parallel execution for independent steps, caching frequent lookups, and optimizing AI prompts.',
    category: 'troubleshooting',
    keywords: ['slow', 'performance', 'speed', 'timeout'],
  },
  {
    id: 'missing-data',
    question: 'Data is not appearing in my workflow',
    answer: 'Check variable mappings and ensure data types match. Use the Debug panel to inspect values at each step. Common fixes: validate JSON paths, check for null values, and verify API permissions.',
    category: 'troubleshooting',
    keywords: ['data', 'missing', 'empty', 'null', 'mapping'],
  },
]

// Common Issues
const COMMON_ISSUES = [
  {
    title: 'Cannot connect to Gmail',
    description: 'Make sure you\'ve granted all required permissions during OAuth. Try disconnecting and reconnecting.',
    link: '/integrations',
  },
  {
    title: 'Workflow stuck in "Running"',
    description: 'Check for infinite loops or external API timeouts. You can cancel the execution from the dashboard.',
    link: '/dashboard',
  },
  {
    title: 'AI responses are inconsistent',
    description: 'Try making your prompts more specific and add examples. Consider increasing the model temperature for creativity.',
    link: '/help?topic=ai-prompts',
  },
]

export function Help() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialTopic = searchParams.get('topic') || ''

  const [searchQuery, setSearchQuery] = useState(initialTopic)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'faq' | 'tutorials' | 'contact'>('faq')

  // Update search when topic param changes
  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic) {
      setSearchQuery(topic)
      setActiveTab('faq')
    }
  }, [searchParams])

  // Filter FAQ items based on search and category
  const filteredFAQ = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory
      const matchesSearch = !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedCategory])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions, learn how to use Nexus, and get support when you need it.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="search"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'faq', label: 'FAQ', icon: '❓' },
            { id: 'tutorials', label: 'Video Tutorials', icon: '🎬' },
            { id: 'contact', label: 'Contact Support', icon: '💬' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-8">
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${!selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                All Topics
              </button>
              {FAQ_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                    ${selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }
                  `}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFAQ.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">No results found for "{searchQuery}"</p>
                  <p className="text-sm">Try a different search term or browse by category.</p>
                </div>
              ) : (
                filteredFAQ.map(item => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium pr-4">{item.question}</span>
                      <svg
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedFAQ === item.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFAQ === item.id && (
                      <div className="px-6 pb-4 text-muted-foreground border-t border-border pt-4 animate-in slide-in-from-top-2">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Common Issues */}
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                Common Issues & Quick Fixes
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {COMMON_ISSUES.map((issue, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                  >
                    <h3 className="font-medium mb-2">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                    <button
                      onClick={() => navigate(issue.link)}
                      className="text-sm text-primary hover:underline"
                    >
                      Go to fix →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && (
          <div className="space-y-12">
            {/* Featured Tutorial */}
            <FeaturedTutorial
              title="Complete Guide to Workflow Automation"
              description="Master Nexus from start to finish. This comprehensive tutorial covers everything from basic workflows to advanced AI agent configurations."
              duration={45}
              category="Masterclass"
              difficulty="beginner"
              comingSoon={true}
              highlight="New Series"
            />

            {/* Tutorial Grid */}
            <div>
              <h2 className="text-xl font-bold mb-6">All Tutorials</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEFAULT_TUTORIALS.map((tutorial, index) => (
                  <TutorialCard key={index} {...tutorial} />
                ))}
              </div>
            </div>

            {/* Request Tutorial */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-8 text-center">
              <h3 className="text-lg font-bold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-4">
                Suggest a tutorial topic and we'll prioritize creating it.
              </p>
              <Button variant="outline">
                Request a Tutorial
              </Button>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Contact Options */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get help via email. We typically respond within 24 hours.
                </p>
                <a
                  href="mailto:support@nexus.ai"
                  className="text-primary hover:underline"
                >
                  support@nexus.ai
                </a>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with our AI assistant or request a human agent.
                </p>
                <Button>Start Chat</Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-lg font-bold mb-6">Send us a message</h3>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input type="email" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or question..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Additional Resources */}
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-bold mb-4">Additional Resources</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Documentation
                </a>
                <a href="#" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Community Forum
                </a>
                <a href="#" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Status Page
                </a>
                <a href="#" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                  </svg>
                  API Reference
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
