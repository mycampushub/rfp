import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'TEST01';

async function main() {
  console.log('=== RFP Platform Seed Script ===\n');

  // ========================================
  // 1. TENANT
  // ========================================
  console.log('Creating/checking tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Test Corp',
      plan: 'enterprise',
      settings: {
        notifications: { emailEnabled: true, smsEnabled: false },
        security: { mfaRequired: false, sessionTimeout: 3600 },
      },
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
    },
  });
  console.log(`  Tenant: ${tenant.id} - ${tenant.name}`);

  // ========================================
  // 2. ROLES
  // ========================================
  console.log('\nCreating roles...');

  const allPermissions = [
    'admin:users', 'admin:roles', 'rfp:create', 'rfp:edit', 'rfp:view',
    'rfp:delete', 'rfp:publish', 'vendor:invite', 'vendor:view',
    'vendor:create', 'vendor:edit', 'vendor:delete', 'submission:view',
    'submission:manage', 'score:create', 'score:edit', 'score:view',
    'score:finalize', 'approval:create', 'approval:edit', 'approval:view',
    'admin:tenant', 'admin:audit', 'qna:manage', 'calendar:manage',
    'messages:manage', 'announcements:manage',
  ];

  const evaluatorPermissions = ['view_rfps', 'evaluate', 'score', 'submission:view', 'score:create', 'score:edit', 'score:view'];
  const vendorPermissions = ['view_rfps', 'submit_proposals', 'manage_profile', 'submission:view'];

  const existingRoles = await prisma.role.findMany({ where: { tenantId: TENANT_ID } });
  const existingRoleNames = existingRoles.map((r: { name: string }) => r.name);

  let adminRole = existingRoles.find((r: { name: string }) => r.name === 'Admin');
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        tenantId: TENANT_ID,
        name: 'Admin',
        permissions: allPermissions,
      },
    });
    console.log(`  Created role: Admin (${adminRole.id})`);
  } else {
    console.log(`  Role exists: Admin (${adminRole.id})`);
  }

  let evaluatorRole = existingRoles.find((r: { name: string }) => r.name === 'Evaluator');
  if (!evaluatorRole) {
    evaluatorRole = await prisma.role.create({
      data: {
        tenantId: TENANT_ID,
        name: 'Evaluator',
        permissions: evaluatorPermissions,
      },
    });
    console.log(`  Created role: Evaluator (${evaluatorRole.id})`);
  } else {
    console.log(`  Role exists: Evaluator (${evaluatorRole.id})`);
  }

  let vendorRole = existingRoles.find((r: { name: string }) => r.name === 'Vendor');
  if (!vendorRole) {
    vendorRole = await prisma.role.create({
      data: {
        tenantId: TENANT_ID,
        name: 'Vendor',
        permissions: vendorPermissions,
      },
    });
    console.log(`  Created role: Vendor (${vendorRole.id})`);
  } else {
    console.log(`  Role exists: Vendor (${vendorRole.id})`);
  }

  // ========================================
  // 3. USERS
  // ========================================
  console.log('\nCreating users...');
  const hashedPassword = await hash('Password123', 12);

  // Preserve existing test user
  let testUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'test@test.com' } },
  });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        tenantId: TENANT_ID,
        email: 'test@test.com',
        name: 'Test User',
        password: hashedPassword,
        roleIds: [adminRole.id],
      },
    });
    console.log('  Created user: test@test.com (Test User)');
  } else {
    console.log('  User exists: test@test.com (preserved)');
  }

  const johnSmith = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'admin@TEST01.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'admin@TEST01.com',
      name: 'John Smith',
      password: hashedPassword,
      roleIds: [adminRole.id],
    },
  });
  console.log(`  Created user: admin@TEST01.com (John Smith) - ${johnSmith.id}`);

  const janeDoe = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'evaluator@TEST01.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'evaluator@TEST01.com',
      name: 'Jane Doe',
      password: hashedPassword,
      roleIds: [evaluatorRole.id],
    },
  });
  console.log(`  Created user: evaluator@TEST01.com (Jane Doe) - ${janeDoe.id}`);

  const bobWilson = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'vendor1@TEST01.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'vendor1@TEST01.com',
      name: 'Bob Wilson',
      password: hashedPassword,
      roleIds: [vendorRole.id],
    },
  });
  console.log(`  Created user: vendor1@TEST01.com (Bob Wilson) - ${bobWilson.id}`);

  const aliceBrown = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'vendor2@TEST01.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'vendor2@TEST01.com',
      name: 'Alice Brown',
      password: hashedPassword,
      roleIds: [vendorRole.id],
    },
  });
  console.log(`  Created user: vendor2@TEST01.com (Alice Brown) - ${aliceBrown.id}`);

  // ========================================
  // 4. VENDORS
  // ========================================
  console.log('\nCreating vendors...');

  const vendor1 = await prisma.vendor.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Acme Technology Solutions',
      description: 'Leading provider of IT services and cloud computing solutions with 15+ years of experience.',
      email: 'info@acmetech.com',
      phone: '(555) 100-0001',
      website: 'https://acmetech.example.com',
      location: 'San Francisco, CA',
      rating: 4.5,
      verified: true,
      categories: ['IT Services', 'Cloud Computing'],
      certifications: ['ISO 27001', 'AWS Advanced Partner', 'SOC 2 Type II'],
    },
  });
  console.log(`  Created vendor: ${vendor1.name} (${vendor1.id})`);

  const vendor2 = await prisma.vendor.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Global Consulting Group',
      description: 'Premier management consulting firm specializing in strategic business transformation.',
      email: 'contact@globalconsulting.example.com',
      phone: '(555) 100-0002',
      website: 'https://globalconsulting.example.com',
      location: 'New York, NY',
      rating: 4.2,
      verified: true,
      categories: ['Management Consulting', 'Strategy'],
      certifications: ['ISO 9001', 'Lean Six Sigma'],
    },
  });
  console.log(`  Created vendor: ${vendor2.name} (${vendor2.id})`);

  const vendor3 = await prisma.vendor.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Digital Innovations Inc',
      description: 'Cutting-edge software development and AI/ML solutions for enterprise clients.',
      email: 'hello@digitalinnovations.example.com',
      phone: '(555) 100-0003',
      website: 'https://digitalinnovations.example.com',
      location: 'Austin, TX',
      rating: 4.8,
      verified: true,
      categories: ['Software Development', 'AI/ML'],
      certifications: ['CMMI Level 5', 'AWS ML Specialty', 'Google Cloud Partner'],
    },
  });
  console.log(`  Created vendor: ${vendor3.name} (${vendor3.id})`);

  const vendor4 = await prisma.vendor.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Premier Logistics Corp',
      description: 'Full-service logistics and supply chain management solutions.',
      email: 'info@premierlogistics.example.com',
      phone: '(555) 100-0004',
      website: 'https://premierlogistics.example.com',
      location: 'Chicago, IL',
      rating: 3.9,
      verified: false,
      categories: ['Logistics', 'Supply Chain'],
      certifications: ['ISO 28000'],
    },
  });
  console.log(`  Created vendor: ${vendor4.name} (${vendor4.id})`);

  const vendor5 = await prisma.vendor.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Green Energy Solutions',
      description: 'Sustainable energy consulting and renewable energy implementation services.',
      email: 'contact@greenenergy.example.com',
      phone: '(555) 100-0005',
      website: 'https://greenenergy.example.com',
      location: 'Portland, OR',
      rating: 4.1,
      verified: true,
      categories: ['Renewable Energy', 'Sustainability'],
      certifications: ['B Corp Certified', 'LEED AP'],
    },
  });
  console.log(`  Created vendor: ${vendor5.name} (${vendor5.id})`);

  // ========================================
  // 5. RFPs
  // ========================================
  console.log('\nCreating RFPs...');

  const rfp1 = await prisma.rFP.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Enterprise Cloud Migration Services',
      description: 'Seeking qualified vendors to provide comprehensive cloud migration services for our enterprise infrastructure, including assessment, planning, migration execution, and post-migration support.',
      status: 'published',
      category: 'IT Services',
      budget: 500000,
      location: 'Remote / On-site as needed',
      organization: 'Test Corp',
      confidentiality: 'internal',
      publishAt: new Date('2025-06-01T09:00:00Z'),
      closeAt: new Date('2025-08-15T17:00:00Z'),
      isPublic: false,
    },
  });
  console.log(`  Created RFP: ${rfp1.title} (${rfp1.id})`);

  const rfp2 = await prisma.rFP.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Office Supply Procurement 2025',
      description: 'Annual procurement of office supplies and equipment for all company locations. Includes stationery, toner, furniture, and breakroom supplies.',
      status: 'published',
      category: 'Procurement',
      budget: 75000,
      location: 'Multiple locations',
      organization: 'Test Corp',
      confidentiality: 'internal',
      publishAt: new Date('2025-07-01T09:00:00Z'),
      closeAt: new Date('2025-09-30T17:00:00Z'),
      isPublic: false,
    },
  });
  console.log(`  Created RFP: ${rfp2.title} (${rfp2.id})`);

  const rfp3 = await prisma.rFP.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Security Audit and Compliance Review',
      description: 'Comprehensive security audit covering network infrastructure, application security, data protection, and regulatory compliance (SOC 2, HIPAA, PCI-DSS).',
      status: 'evaluation',
      category: 'Security',
      budget: 120000,
      location: 'On-site required',
      organization: 'Test Corp',
      confidentiality: 'confidential',
      publishAt: new Date('2025-05-15T09:00:00Z'),
      closeAt: new Date('2025-07-01T17:00:00Z'),
      isPublic: false,
    },
  });
  console.log(`  Created RFP: ${rfp3.title} (${rfp3.id})`);

  const rfp4 = await prisma.rFP.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Marketing Campaign Strategy',
      description: 'Develop and execute a comprehensive multi-channel marketing campaign strategy for Q4 2025 product launch including digital, print, and event marketing.',
      status: 'awarded',
      category: 'Marketing',
      budget: 200000,
      location: 'Remote',
      organization: 'Test Corp',
      confidentiality: 'internal',
      publishAt: new Date('2025-03-01T09:00:00Z'),
      closeAt: new Date('2025-04-15T17:00:00Z'),
      isPublic: false,
    },
  });
  console.log(`  Created RFP: ${rfp4.title} (${rfp4.id})`);

  const rfp5 = await prisma.rFP.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Facility Management Services',
      description: 'Comprehensive facility management including maintenance, cleaning, security, and space planning for corporate headquarters and regional offices.',
      status: 'draft',
      category: 'Facilities',
      budget: 350000,
      location: 'Multiple locations',
      organization: 'Test Corp',
      confidentiality: 'internal',
      isPublic: false,
    },
  });
  console.log(`  Created RFP: ${rfp5.title} (${rfp5.id})`);

  // ========================================
  // 6. SECTIONS
  // ========================================
  console.log('\nCreating sections...');

  // RFP 1 sections (3)
  const s1_1 = await prisma.section.create({
    data: {
      rfpId: rfp1.id,
      order: 1,
      title: 'Company Overview',
      description: 'Detailed requirements for company overview section. Please provide information about your organization, history, key personnel, and relevant experience with enterprise cloud migrations.',
      isRequired: true,
    },
  });
  const s1_2 = await prisma.section.create({
    data: {
      rfpId: rfp1.id,
      order: 2,
      title: 'Technical Requirements',
      description: 'Detailed requirements for technical approach section. Describe your proposed cloud architecture, migration methodology, tooling, and technical capabilities.',
      isRequired: true,
    },
  });
  const s1_3 = await prisma.section.create({
    data: {
      rfpId: rfp1.id,
      order: 3,
      title: 'Pricing Structure',
      description: 'Detailed requirements for pricing section. Provide a comprehensive breakdown of all costs including licensing, migration labor, training, and ongoing support.',
      isRequired: true,
    },
  });

  // RFP 2 sections (2)
  const s2_1 = await prisma.section.create({
    data: {
      rfpId: rfp2.id,
      order: 1,
      title: 'Vendor Qualifications',
      description: 'Detailed requirements for vendor qualifications section. Include company background, certifications, delivery capabilities, and references from similar engagements.',
      isRequired: true,
    },
  });
  const s2_2 = await prisma.section.create({
    data: {
      rfpId: rfp2.id,
      order: 2,
      title: 'Pricing',
      description: 'Detailed requirements for pricing section. Provide unit pricing for all supply categories, volume discount structure, and delivery cost breakdown.',
      isRequired: true,
    },
  });

  // RFP 3 sections (3)
  const s3_1 = await prisma.section.create({
    data: {
      rfpId: rfp3.id,
      order: 1,
      title: 'Scope of Work',
      description: 'Detailed requirements for scope of work section. Define the complete scope of the security audit including all systems, networks, and compliance frameworks to be assessed.',
      isRequired: true,
    },
  });
  const s3_2 = await prisma.section.create({
    data: {
      rfpId: rfp3.id,
      order: 2,
      title: 'Team Composition',
      description: 'Detailed requirements for team composition section. List all team members who will work on this engagement, their qualifications, certifications, and roles.',
      isRequired: true,
    },
  });
  const s3_3 = await prisma.section.create({
    data: {
      rfpId: rfp3.id,
      order: 3,
      title: 'Methodology',
      description: 'Detailed requirements for methodology section. Describe your audit methodology, tools used, reporting format, and approach to remediation recommendations.',
      isRequired: true,
    },
  });

  // RFP 4 sections (2)
  const s4_1 = await prisma.section.create({
    data: {
      rfpId: rfp4.id,
      order: 1,
      title: 'Campaign Strategy',
      description: 'Detailed requirements for campaign strategy section. Outline your proposed multi-channel marketing approach, target audience analysis, and creative direction.',
      isRequired: true,
    },
  });
  const s4_2 = await prisma.section.create({
    data: {
      rfpId: rfp4.id,
      order: 2,
      title: 'Budget Breakdown',
      description: 'Detailed requirements for budget breakdown section. Provide detailed cost allocation across all marketing channels, timeline-based spending, and ROI projections.',
      isRequired: true,
    },
  });

  console.log('  Created 10 sections across 4 RFPs');

  // ========================================
  // 7. QUESTIONS
  // ========================================
  console.log('\nCreating questions...');

  // Section s1_1: Company Overview (2 questions)
  await prisma.question.create({ data: { sectionId: s1_1.id, type: 'text', prompt: 'What is your experience with enterprise cloud migration projects of similar scale?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s1_1.id, type: 'text', prompt: 'How many certified cloud architects does your team have?', required: true, order: 2 } });

  // Section s1_2: Technical Requirements (3 questions)
  await prisma.question.create({ data: { sectionId: s1_2.id, type: 'text', prompt: 'What cloud platforms do you specialize in and what level of partnership do you hold?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s1_2.id, type: 'text', prompt: 'Describe your approach to handling legacy application modernization during migration.', required: true, order: 2 } });
  await prisma.question.create({ data: { sectionId: s1_2.id, type: 'text', prompt: 'What is your experience with implementing zero-downtime migration strategies?', required: true, order: 3 } });

  // Section s1_3: Pricing Structure (2 questions)
  await prisma.question.create({ data: { sectionId: s1_3.id, type: 'text', prompt: 'What is your pricing model for cloud migration engagements?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s1_3.id, type: 'text', prompt: 'What ongoing support costs should we expect post-migration?', required: true, order: 2 } });

  // Section s2_1: Vendor Qualifications (2 questions)
  await prisma.question.create({ data: { sectionId: s2_1.id, type: 'text', prompt: 'What is your experience with large-scale office supply procurement?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s2_1.id, type: 'text', prompt: 'Can you provide references from comparable procurement contracts?', required: true, order: 2 } });

  // Section s2_2: Pricing (2 questions)
  await prisma.question.create({ data: { sectionId: s2_2.id, type: 'text', prompt: 'What volume discount tiers do you offer?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s2_2.id, type: 'text', prompt: 'What are your standard payment terms and delivery lead times?', required: true, order: 2 } });

  // Section s3_1: Scope of Work (2 questions)
  await prisma.question.create({ data: { sectionId: s3_1.id, type: 'text', prompt: 'What compliance frameworks have you audited against (SOC 2, HIPAA, PCI-DSS)?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s3_1.id, type: 'text', prompt: 'How do you handle penetration testing for cloud-hybrid environments?', required: true, order: 2 } });

  // Section s3_2: Team Composition (3 questions)
  await prisma.question.create({ data: { sectionId: s3_2.id, type: 'text', prompt: 'What security certifications (CISSP, CEH, OSCP) does your team hold?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s3_2.id, type: 'text', prompt: 'Will the same team be assigned throughout the engagement?', required: true, order: 2 } });
  await prisma.question.create({ data: { sectionId: s3_2.id, type: 'text', prompt: 'What is the average years of experience of your senior auditors?', required: true, order: 3 } });

  // Section s3_3: Methodology (2 questions)
  await prisma.question.create({ data: { sectionId: s3_3.id, type: 'text', prompt: 'What automated tools and frameworks do you use in your audit process?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s3_3.id, type: 'text', prompt: 'How do you prioritize and report on critical vs. low-risk findings?', required: true, order: 2 } });

  // Section s4_1: Campaign Strategy (2 questions)
  await prisma.question.create({ data: { sectionId: s4_1.id, type: 'text', prompt: 'What is your experience with B2B multi-channel marketing campaigns?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s4_1.id, type: 'text', prompt: 'How do you measure and attribute campaign performance across channels?', required: true, order: 2 } });

  // Section s4_2: Budget Breakdown (2 questions)
  await prisma.question.create({ data: { sectionId: s4_2.id, type: 'text', prompt: 'What is your recommended budget allocation across digital, print, and events?', required: true, order: 1 } });
  await prisma.question.create({ data: { sectionId: s4_2.id, type: 'text', prompt: 'What ROI metrics and KPIs will you track throughout the campaign?', required: true, order: 2 } });

  console.log('  Created 22 questions across 10 sections');

  // ========================================
  // 8. RUBRIC CRITERIA
  // ========================================
  console.log('\nCreating rubric criteria...');

  // RFP 1 criteria (2)
  const rc1 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp1.id,
      label: 'Technical Expertise',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the vendor\'s technical capabilities, cloud expertise, and proposed architecture quality.',
    },
  });
  const rc2 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp1.id,
      label: 'Cost Competitiveness',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the overall cost competitiveness, value for money, and pricing transparency.',
    },
  });

  // RFP 3 criteria (2)
  const rc3 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp3.id,
      label: 'Audit Methodology',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the thoroughness and rigor of the proposed security audit methodology.',
    },
  });
  const rc4 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp3.id,
      label: 'Team Qualifications',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the qualifications, certifications, and experience of the proposed audit team.',
    },
  });

  // RFP 4 criteria (2)
  const rc5 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp4.id,
      label: 'Creative Strategy',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the creativity, innovation, and strategic alignment of the proposed campaign.',
    },
  });
  const rc6 = await prisma.rubricCriterion.create({
    data: {
      rfpId: rfp4.id,
      label: 'Budget Efficiency',
      weight: 0.5,
      scaleMin: 1,
      scaleMax: 100,
      guidance: 'Evaluate the efficiency of budget allocation and projected ROI.',
    },
  });

  console.log('  Created 6 rubric criteria across 3 RFPs');

  // ========================================
  // 9. SUBMISSIONS
  // ========================================
  console.log('\nCreating submissions...');

  // 2 submissions for RFP 1
  const sub1 = await prisma.submission.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor1.id,
      status: 'submitted',
      submittedAt: new Date('2025-07-20T14:30:00Z'),
    },
  });
  console.log(`  Created submission: ${vendor1.name} -> RFP 1 (${sub1.id})`);

  const sub2 = await prisma.submission.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor3.id,
      status: 'under_review',
      submittedAt: new Date('2025-07-18T10:15:00Z'),
    },
  });
  console.log(`  Created submission: ${vendor3.name} -> RFP 1 (${sub2.id})`);

  // 1 submission for RFP 2
  const sub3 = await prisma.submission.create({
    data: {
      rfpId: rfp2.id,
      vendorId: vendor2.id,
      status: 'submitted',
      submittedAt: new Date('2025-08-15T16:00:00Z'),
    },
  });
  console.log(`  Created submission: ${vendor2.name} -> RFP 2 (${sub3.id})`);

  // 1 submission for RFP 3
  const sub4 = await prisma.submission.create({
    data: {
      rfpId: rfp3.id,
      vendorId: vendor1.id,
      status: 'submitted',
      submittedAt: new Date('2025-06-28T11:45:00Z'),
    },
  });
  console.log(`  Created submission: ${vendor1.name} -> RFP 3 (${sub4.id})`);

  // ========================================
  // 10. SCORES
  // ========================================
  console.log('\nCreating scores...');

  // Evaluator IDs: testUser, janeDoe (we also use johnSmith as a third evaluator)
  const evaluatorIds = [testUser!.id, janeDoe.id, johnSmith.id];

  // 3 scores for submission 1 (from 3 evaluators on 2 criteria each = 6 scores, but task says 3 scores for sub1)
  // Actually re-reading: "3 scores for submission 1 (from 3 evaluators)" - 1 score each
  // "3 scores for submission 2 (from 3 evaluators)" - 1 score each
  // Each score needs a criterionId, so let's distribute across the 2 criteria
  await prisma.score.create({ data: { submissionId: sub1.id, criterionId: rc1.id, evaluatorId: evaluatorIds[0], scoreValue: 88, notes: 'Strong proposal with excellent technical depth and clear architecture diagrams.' } });
  await prisma.score.create({ data: { submissionId: sub1.id, criterionId: rc2.id, evaluatorId: evaluatorIds[1], scoreValue: 82, notes: 'Strong proposal with competitive pricing and good value proposition.' } });
  await prisma.score.create({ data: { submissionId: sub1.id, criterionId: rc1.id, evaluatorId: evaluatorIds[2], scoreValue: 91, notes: 'Strong proposal with outstanding technical approach and innovative migration strategy.' } });

  await prisma.score.create({ data: { submissionId: sub2.id, criterionId: rc1.id, evaluatorId: evaluatorIds[0], scoreValue: 95, notes: 'Strong proposal with cutting-edge AI-enhanced migration approach.' } });
  await prisma.score.create({ data: { submissionId: sub2.id, criterionId: rc2.id, evaluatorId: evaluatorIds[1], scoreValue: 78, notes: 'Strong proposal with slightly higher cost but justified by premium service offering.' } });
  await prisma.score.create({ data: { submissionId: sub2.id, criterionId: rc1.id, evaluatorId: evaluatorIds[2], scoreValue: 85, notes: 'Strong proposal with solid technical foundation and good reference cases.' } });

  console.log('  Created 6 scores across 2 submissions');

  // ========================================
  // 11. QnA
  // ========================================
  console.log('\nCreating QnA entries...');

  await prisma.qnA.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor1.id,
      questionText: 'What is the expected timeline for completing the cloud migration?',
      answerText: 'The expected timeline is 12-18 months for full migration, with an initial assessment phase of 4-6 weeks.',
      isPublic: true,
      status: 'answered',
    },
  });
  await prisma.qnA.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor3.id,
      questionText: 'What is the expected timeline for the proof-of-concept phase?',
      answerText: 'The expected timeline for the PoC phase is 6-8 weeks, including setup, testing, and evaluation.',
      isPublic: true,
      status: 'answered',
    },
  });
  await prisma.qnA.create({
    data: {
      rfpId: rfp2.id,
      vendorId: vendor2.id,
      questionText: 'What is the expected timeline for vendor onboarding and first delivery?',
      answerText: 'The expected timeline for onboarding is 2 weeks, with first delivery within 4 weeks of contract signing.',
      isPublic: true,
      status: 'answered',
    },
  });
  await prisma.qnA.create({
    data: {
      rfpId: rfp3.id,
      vendorId: vendor1.id,
      questionText: 'What is the expected timeline for the security audit report delivery?',
      answerText: 'The expected timeline is 4-6 weeks from engagement start, with interim findings reported weekly.',
      isPublic: true,
      status: 'answered',
    },
  });
  await prisma.qnA.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor5.id,
      questionText: 'What is the expected timeline for sustainability compliance verification?',
      answerText: 'The expected timeline for sustainability verification is 3-4 weeks as part of the due diligence phase.',
      isPublic: true,
      status: 'answered',
    },
  });

  console.log('  Created 5 QnA entries');

  // ========================================
  // 12. APPROVALS
  // ========================================
  console.log('\nCreating approvals...');

  await prisma.approval.create({
    data: {
      rfpId: rfp2.id,
      approverId: johnSmith.id,
      stage: 'budget',
      status: 'approved',
      decidedAt: new Date('2025-06-28T10:00:00Z'),
      comments: 'Budget approved for office supply procurement.',
    },
  });
  await prisma.approval.create({
    data: {
      rfpId: rfp4.id,
      approverId: johnSmith.id,
      stage: 'legal',
      status: 'approved',
      decidedAt: new Date('2025-02-20T14:00:00Z'),
      comments: 'Legal review completed and approved.',
    },
  });
  await prisma.approval.create({
    data: {
      rfpId: rfp1.id,
      approverId: johnSmith.id,
      stage: 'procurement',
      status: 'pending',
      comments: 'Awaiting procurement team review.',
    },
  });

  console.log('  Created 3 approvals');

  // ========================================
  // 13. ADDENDA
  // ========================================
  console.log('\nCreating addenda...');

  await prisma.addendum.create({
    data: {
      rfpId: rfp1.id,
      title: 'Deadline Extension',
      note: 'Deadline extended by 2 weeks due to vendor requests. New submission deadline is August 15, 2025.',
      requiresAck: true,
    },
  });
  await prisma.addendum.create({
    data: {
      rfpId: rfp3.id,
      title: 'Additional Evaluation Criteria',
      note: 'Additional evaluation criteria added for vendor experience with zero-trust architecture implementations.',
      requiresAck: true,
    },
  });

  console.log('  Created 2 addenda');

  // ========================================
  // 14. INVITATIONS
  // ========================================
  console.log('\nCreating invitations...');

  await prisma.invitation.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor1.id,
      email: 'info@acmetech.com',
      token: 'inv-acme-rfp1-' + Date.now(),
      status: 'accepted',
      expiresAt: new Date('2025-08-15T17:00:00Z'),
    },
  });
  await prisma.invitation.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor3.id,
      email: 'hello@digitalinnovations.example.com',
      token: 'inv-digital-rfp1-' + Date.now(),
      status: 'accepted',
      expiresAt: new Date('2025-08-15T17:00:00Z'),
    },
  });
  await prisma.invitation.create({
    data: {
      rfpId: rfp1.id,
      vendorId: vendor5.id,
      email: 'contact@greenenergy.example.com',
      token: 'inv-green-rfp1-' + Date.now(),
      status: 'pending',
      expiresAt: new Date('2025-08-15T17:00:00Z'),
    },
  });

  console.log('  Created 3 invitations');

  // ========================================
  // 15. CALENDAR EVENTS
  // ========================================
  console.log('\nCreating calendar events...');

  await prisma.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      rfpId: rfp1.id,
      title: 'RFP 1 Deadline Meeting',
      description: 'Final review meeting before submission deadline for Enterprise Cloud Migration Services RFP.',
      startDate: new Date('2025-08-14T14:00:00Z'),
      endDate: new Date('2025-08-14T15:30:00Z'),
      type: 'deadline',
      status: 'upcoming',
      location: 'Conference Room A',
    },
  });
  await prisma.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      rfpId: rfp3.id,
      title: 'RFP 3 Evaluation Session',
      description: 'Panel evaluation session for Security Audit and Compliance Review submissions.',
      startDate: new Date('2025-07-10T09:00:00Z'),
      endDate: new Date('2025-08-10T11:00:00Z'),
      type: 'meeting',
      status: 'upcoming',
      location: 'Secure Conference Room B',
      meetingUrl: 'https://meet.example.com/eval-session',
    },
  });
  await prisma.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Vendor Presentation Day',
      description: 'Scheduled presentations from shortlisted vendors for cloud migration RFP.',
      startDate: new Date('2025-08-20T10:00:00Z'),
      endDate: new Date('2025-08-20T16:00:00Z'),
      type: 'event',
      status: 'upcoming',
      location: 'Main Auditorium',
    },
  });
  await prisma.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Team Standup',
      description: 'Weekly procurement team standup to review active RFPs and upcoming deadlines.',
      startDate: new Date('2025-08-11T09:00:00Z'),
      endDate: new Date('2025-08-11T09:30:00Z'),
      type: 'meeting',
      status: 'upcoming',
      meetingUrl: 'https://meet.example.com/standup',
    },
  });
  await prisma.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Monthly Review',
      description: 'Monthly procurement review meeting to discuss pipeline, vendor performance, and strategic priorities.',
      startDate: new Date('2025-09-01T13:00:00Z'),
      endDate: new Date('2025-08-01T15:00:00Z'),
      type: 'meeting',
      status: 'upcoming',
      location: 'Executive Board Room',
    },
  });

  console.log('  Created 5 calendar events');

  // ========================================
  // 16. MESSAGE THREADS & MESSAGES
  // ========================================
  console.log('\nCreating message threads and messages...');

  const thread1 = await prisma.messageThread.create({
    data: {
      tenantId: TENANT_ID,
      participantIds: [johnSmith.id, janeDoe.id],
      subject: 'RFP 3 - Security Audit Evaluation Discussion',
      lastMessageAt: new Date('2025-07-11T10:30:00Z'),
    },
  });
  const thread2 = await prisma.messageThread.create({
    data: {
      tenantId: TENANT_ID,
      participantIds: [johnSmith.id, bobWilson.id],
      subject: 'RFP 1 - Cloud Migration Clarifications',
      lastMessageAt: new Date('2025-07-05T14:20:00Z'),
    },
  });
  const thread3 = await prisma.messageThread.create({
    data: {
      tenantId: TENANT_ID,
      participantIds: [bobWilson.id, aliceBrown.id],
      subject: 'General Discussion - Vendor Collaboration Opportunities',
      lastMessageAt: new Date('2025-07-08T09:15:00Z'),
    },
  });

  // Messages for thread 1
  await prisma.message.create({ data: { threadId: thread1.id, senderId: johnSmith.id, content: 'Hi Jane, I wanted to discuss the evaluation timeline for the Security Audit RFP. Do you think 2 weeks is sufficient for the initial review?', isRead: true, createdAt: new Date('2025-07-10T09:00:00Z') } });
  await prisma.message.create({ data: { threadId: thread1.id, senderId: janeDoe.id, content: 'Hi John, 2 weeks should be fine for the initial review. I have already started reviewing Acme Tech\'s submission and it looks comprehensive. We should schedule a calibration session by end of week.', isRead: true, createdAt: new Date('2025-07-10T10:30:00Z') } });

  // Messages for thread 2
  await prisma.message.create({ data: { threadId: thread2.id, senderId: bobWilson.id, content: 'John, we have a question about the cloud migration requirements. Can you clarify the expected number of workloads to be migrated in phase 1?', isRead: true, createdAt: new Date('2025-07-04T11:00:00Z') } });
  await prisma.message.create({ data: { threadId: thread2.id, senderId: johnSmith.id, content: 'Bob, phase 1 covers approximately 200 workloads including the core ERP and CRM systems. The full scope document has been updated in the RFP portal with the detailed breakdown.', isRead: true, createdAt: new Date('2025-07-05T14:20:00Z') } });

  // Messages for thread 3
  await prisma.message.create({ data: { threadId: thread3.id, senderId: bobWilson.id, content: 'Hi Alice, I noticed your company is also bidding on the cloud migration RFP. Would you be interested in exploring a partnership for the implementation phase?', isRead: true, createdAt: new Date('2025-07-07T16:00:00Z') } });
  await prisma.message.create({ data: { threadId: thread3.id, senderId: aliceBrown.id, content: 'Hi Bob, that is an interesting idea. Our consulting team could definitely add value to the change management and training aspects. Let us set up a call to discuss further.', isRead: true, createdAt: new Date('2025-07-08T09:15:00Z') } });

  console.log('  Created 3 message threads with 6 messages');

  // ========================================
  // 17. NOTIFICATIONS
  // ========================================
  console.log('\nCreating notifications...');

  await prisma.notification.create({
    data: {
      userId: johnSmith.id,
      type: 'rfp_published',
      title: 'New RFP Published',
      message: 'Enterprise Cloud Migration Services RFP has been published and is now accepting proposals.',
    },
  });
  await prisma.notification.create({
    data: {
      userId: johnSmith.id,
      type: 'submission_received',
      title: 'New Submission Received',
      message: 'Acme Technology Solutions has submitted a proposal for the Enterprise Cloud Migration Services RFP.',
    },
  });
  await prisma.notification.create({
    data: {
      userId: johnSmith.id,
      type: 'approval_requested',
      title: 'Approval Required',
      message: 'Budget approval is required for the Office Supply Procurement 2025 RFP before it can move to the next stage.',
    },
  });
  await prisma.notification.create({
    data: {
      userId: johnSmith.id,
      type: 'deadline_approaching',
      title: 'Deadline Approaching',
      message: 'The submission deadline for Enterprise Cloud Migration Services RFP is in 3 days. 2 vendors have been invited.',
    },
  });
  await prisma.notification.create({
    data: {
      userId: johnSmith.id,
      type: 'evaluation_complete',
      title: 'Evaluation Completed',
      message: 'All evaluators have completed their scoring for the Security Audit and Compliance Review RFP. Consensus review is now available.',
    },
  });

  console.log('  Created 5 notifications');

  // ========================================
  // NOTE: Announcements
  // ========================================
  // The schema does not include an Announcement model. If one is added in the future,
  // seed data for announcements should be included here.
  console.log('\n  (Skipped announcements - no Announcement model in schema)');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n=== Seed Complete ===');
  console.log('Summary of created data:');
  console.log('  - 1 Tenant (TEST01)');
  console.log('  - 3 Roles (Admin, Evaluator, Vendor)');
  console.log('  - 5 Users (1 preserved, 4 new)');
  console.log('  - 5 Vendors');
  console.log('  - 5 RFPs (published, published, evaluation, awarded, draft)');
  console.log('  - 10 Sections');
  console.log('  - 22 Questions');
  console.log('  - 6 Rubric Criteria');
  console.log('  - 4 Submissions');
  console.log('  - 6 Scores');
  console.log('  - 5 QnA entries');
  console.log('  - 3 Approvals');
  console.log('  - 2 Addenda');
  console.log('  - 3 Invitations');
  console.log('  - 5 Calendar Events');
  console.log('  - 3 Message Threads + 6 Messages');
  console.log('  - 5 Notifications');
}

main()
  .catch((e) => {
    console.error('Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
