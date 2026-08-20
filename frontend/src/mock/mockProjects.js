import { normalizeMember } from './mockMembers';

export const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Company Website overhaul with new branding and improved user experience.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      normalizeMember('Alex Johnson'),
      normalizeMember('Sara Smith'),
      normalizeMember('David W')
    ],
    createdDate: '06 Aug 2026',
    dueDate: '30 Sep 2026',
    status: 'In Progress',
    progress: 75,
    tasks: [
      {
        id: 't1-1', title: 'Header & Navigation UX', completed: true, status: 'completed', priority: 'high',
        subtasks: [
          { id: 'st1', label: 'Navbar Responsiveness', done: true, completed: true },
          { id: 'st2', label: 'Dark Mode Switcher', done: true, completed: true },
          { id: 'st3', label: 'Mobile Drawer Menu', done: true, completed: true }
        ]
      },
      {
        id: 't1-2', title: 'Landing Page Hero Section', completed: false, status: 'in_progress', priority: 'medium',
        subtasks: [
          { id: 'st4', label: 'Hero Copy & Headlines', done: true, completed: true },
          { id: 'st5', label: 'CTA Button Micro-animations', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Inventory System',
    description: 'Warehouse Management application for tracking real-time stock levels.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&auto=format&fit=crop&q=80',
    owner: 'Sara Smith',
    members: [
      normalizeMember('Sara Smith'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '04 Aug 2026',
    dueDate: '15 Oct 2026',
    status: 'In Progress',
    progress: 40,
    tasks: [
      {
        id: 't2-1', title: 'Barcode Scanner Module', completed: false, status: 'todo', priority: 'high',
        subtasks: [
          { id: 'st2-1', label: 'Camera API Integration', done: true, completed: true },
          { id: 'st2-2', label: 'Batch Item Lookup', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-3',
    name: 'Mobile App Launch',
    description: 'Field Service Mobile App for technicians to report on-site issues.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      normalizeMember('Alex Johnson'),
      normalizeMember('Elena V')
    ],
    createdDate: '01 Aug 2026',
    dueDate: '20 Nov 2026',
    status: 'Planning',
    progress: 15,
    tasks: [
      {
        id: 't3-1', title: 'Offline Mode Synchronization', completed: false, status: 'todo', priority: 'medium',
        subtasks: [
          { id: 'st3-1', label: 'IndexedDB Storage Setup', done: false, completed: false },
          { id: 'st3-2', label: 'Background Sync Worker', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-4',
    name: 'Customer Portal',
    description: 'Self-Service Support Hub for clients to manage their subscriptions.',
    color: 'yellow',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    owner: 'John Doe',
    members: [
      normalizeMember('John Doe'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '28 Jul 2026',
    dueDate: '10 Aug 2026',
    status: 'Completed',
    progress: 100,
    tasks: [
      {
        id: 't4-1', title: 'Billing History & Invoices', completed: true, status: 'completed', priority: 'low',
        subtasks: [
          { id: 'st4-1', label: 'PDF Invoice Generation', done: true, completed: true },
          { id: 'st4-2', label: 'Stripe Receipt Webhook', done: true, completed: true }
        ]
      }
    ]
  },
  {
    id: 'proj-5',
    name: 'Marketing Campaign',
    description: 'Q4 Digital Marketing Campaign targeting enterprise customers.',
    color: 'red',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
    owner: 'Elena V',
    members: [
      normalizeMember('Elena V'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '15 Jul 2026',
    dueDate: '01 Nov 2026',
    status: 'In Progress',
    progress: 60,
    tasks: [
      { id: 't5-1', title: 'Ad Copy & Creatives', completed: true, status: 'completed', priority: 'medium' },
      { id: 't5-2', title: 'Target Audience Segmentation', completed: false, status: 'in_progress', priority: 'high' }
    ]
  },
  {
    id: 'proj-6',
    name: 'Data Analytics Dashboard',
    description: 'Internal dashboard for visualizing sales metrics.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      normalizeMember('Alex Johnson'),
      normalizeMember('Sara Smith')
    ],
    createdDate: '10 Jul 2026',
    dueDate: '05 Aug 2026',
    status: 'Completed',
    progress: 100,
    tasks: [
      { id: 't6-1', title: 'Chart.js & D3 Data Pipelines', completed: true, status: 'completed', priority: 'medium' }
    ]
  },
  {
    id: 'proj-7',
    name: 'Authentication Service',
    description: 'Migrating legacy auth to standard OAuth2 and SSO.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
    owner: 'Alex Johnson',
    members: [
      normalizeMember('Alex Johnson'),
      normalizeMember('David W')
    ],
    createdDate: '02 Jul 2026',
    dueDate: '15 Dec 2026',
    status: 'In Progress',
    progress: 30,
    tasks: [
      { id: 't7-1', title: 'OAuth2 Token Rotation', completed: false, status: 'in_progress', priority: 'high' }
    ]
  },
  {
    id: 'proj-8',
    name: 'User Research Q3',
    description: 'Interviewing power users to understand feature gaps.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80',
    owner: 'Sara Smith',
    members: [
      normalizeMember('Sara Smith'),
      normalizeMember('Alex Johnson'),
      normalizeMember('Elena V')
    ],
    createdDate: '20 Jun 2026',
    dueDate: '25 Jul 2026',
    status: 'Completed',
    progress: 100,
    tasks: [
      { id: 't8-1', title: 'Synthesize Interview Findings', completed: true, status: 'completed', priority: 'low' }
    ]
  },
  {
    id: 'proj-sp-1',
    name: 'E-Commerce Mobile Platform',
    description: 'Next-gen mobile shopping experience with instant checkout and AI recommendations.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=500&auto=format&fit=crop&q=80',
    owner: 'Sathsarani Perera',
    members: [
      normalizeMember('Sathsarani Perera'),
      normalizeMember('Isuri Perera'),
      normalizeMember('Alex Johnson')
    ],
    createdDate: '10 Aug 2026',
    dueDate: '25 Nov 2026',
    status: 'In Progress',
    progress: 65,
    tasks: [
      {
        id: 'tsp1-1', title: 'Product Catalog & Search Filters', completed: true, status: 'completed', priority: 'high',
        subtasks: [
          { id: 'st-sp1', label: 'Elasticsearch Indexing', done: true, completed: true },
          { id: 'st-sp2', label: 'Filter Drawer Component', done: true, completed: true }
        ]
      },
      {
        id: 'tsp1-2', title: 'Stripe One-Click Payment', completed: false, status: 'in_progress', priority: 'high',
        subtasks: [
          { id: 'st-sp3', label: 'Apple Pay & Google Pay tokens', done: true, completed: true },
          { id: 'st-sp4', label: 'Payment Webhook error handler', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-sp-2',
    name: 'Cloud Migration Architecture',
    description: 'Migrate on-premise infrastructure to scalable AWS serverless microservices.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    owner: 'Sathsarani Perera',
    members: [
      normalizeMember('Sathsarani Perera'),
      normalizeMember('David W')
    ],
    createdDate: '01 Aug 2026',
    dueDate: '15 Dec 2026',
    status: 'In Progress',
    progress: 40,
    tasks: [
      {
        id: 'tsp2-1', title: 'Terraform Scripts & VPC Setup', completed: false, status: 'todo', priority: 'medium',
        subtasks: [
          { id: 'st-sp5', label: 'Multi-region VPC peering', done: true, completed: true },
          { id: 'st-sp6', label: 'IAM Roles and Least Privilege Security', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-sp-3',
    name: 'AI Smart Search Service',
    description: 'Semantic vector search engine using embedding models for contextual product discovery.',
    color: 'green',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    owner: 'Sathsarani Perera',
    members: [
      normalizeMember('Sathsarani Perera'),
      normalizeMember('Sara Smith'),
      normalizeMember('Isuri Perera')
    ],
    createdDate: '15 Jul 2026',
    dueDate: '30 Oct 2026',
    status: 'In Progress',
    progress: 90,
    tasks: [
      {
        id: 'tsp3-1', title: 'Vector Database Integration', completed: true, status: 'completed', priority: 'high',
        subtasks: [
          { id: 'st-sp7', label: 'Pinecone / Qdrant indexing', done: true, completed: true },
          { id: 'st-sp8', label: 'Hybrid search re-ranking pipeline', done: true, completed: true }
        ]
      }
    ]
  },
  {
    id: 'proj-ip-1',
    name: 'Enterprise CRM Integration',
    description: 'Unified customer relationship management portal with automated lead scoring.',
    color: 'yellow',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=80',
    owner: 'Isuri Perera',
    members: [
      normalizeMember('Isuri Perera'),
      normalizeMember('Sathsarani Perera'),
      normalizeMember('John Doe')
    ],
    createdDate: '08 Aug 2026',
    dueDate: '20 Nov 2026',
    status: 'In Progress',
    progress: 50,
    tasks: [
      {
        id: 'tip1-1', title: 'HubSpot API Webhooks', completed: true, status: 'completed', priority: 'medium',
        subtasks: [
          { id: 'st-ip1', label: 'Contact syncing sync worker', done: true, completed: true }
        ]
      },
      {
        id: 'tip1-2', title: 'Deal Pipeline Analytics', completed: false, status: 'in_progress', priority: 'high',
        subtasks: [
          { id: 'st-ip2', label: 'Conversion rate chart', done: false, completed: false }
        ]
      }
    ]
  },
  {
    id: 'proj-ip-2',
    name: 'FinTech Payment Gateway',
    description: 'High-throughput payment orchestration platform with fraud detection algorithms.',
    color: 'red',
    coverImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
    owner: 'Isuri Perera',
    members: [
      normalizeMember('Isuri Perera'),
      normalizeMember('Sathsarani Perera'),
      normalizeMember('Elena V')
    ],
    createdDate: '25 Jul 2026',
    dueDate: '10 Oct 2026',
    status: 'In Progress',
    progress: 80,
    tasks: [
      {
        id: 'tip2-1', title: '3D Secure 2.0 Compliance', completed: true, status: 'completed', priority: 'high',
        subtasks: [
          { id: 'st-ip3', label: 'Biometric challenge fallback', done: true, completed: true },
          { id: 'st-ip4', label: 'Risk assessment engine rules', done: true, completed: true }
        ]
      }
    ]
  },
  {
    id: 'proj-ip-3',
    name: 'Supply Chain Tracker',
    description: 'Real-time GPS tracking and temperature logging for perishable goods logistics.',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
    owner: 'Isuri Perera',
    members: [
      normalizeMember('Isuri Perera'),
      normalizeMember('Sathsarani Perera')
    ],
    createdDate: '02 Aug 2026',
    dueDate: '05 Dec 2026',
    status: 'Planning',
    progress: 25,
    tasks: [
      {
        id: 'tip3-1', title: 'IoT Sensor MQTT Broker', completed: false, status: 'todo', priority: 'medium',
        subtasks: [
          { id: 'st-ip5', label: 'Telemetry stream ingestion', done: true, completed: true },
          { id: 'st-ip6', label: 'Threshold alerting SMS system', done: false, completed: false }
        ]
      }
    ]
  }
];
