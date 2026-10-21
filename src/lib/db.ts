import fs from 'fs';
import path from 'path';
import {
  Workspace,
  User,
  Loan,
  Condition,
  Document,
  DocumentConditionLink,
  Exception,
  Task,
  ActivityLog,
  SystemSettings,
  UserRole,
  CustomForm,
  FormSubmission,
  FormField,
  Form1003Data,
} from '@/types';

interface DatabaseSchema {
  workspaces: Workspace[];
  users: User[];
  loans: Loan[];
  conditions: Condition[];
  documents: Document[];
  documentConditionLinks: DocumentConditionLink[];
  exceptions: Exception[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  settings: SystemSettings[];
  forms: CustomForm[];
  formSubmissions: FormSubmission[];
}

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'mortgage_db.json');

// Initial seed data with realistic US mortgage brokerage workflow
function getInitialData(): DatabaseSchema {
  const ws1Id = 'ws-apex-101';
  const ws2Id = 'ws-summit-202';

  const users: User[] = [
    {
      id: 'usr-1',
      workspaceId: ws1Id,
      name: 'Sarah Jenkins',
      email: 's.jenkins@apexlending.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-01-10T09:00:00Z',
    },
    {
      id: 'usr-2',
      workspaceId: ws1Id,
      name: 'David Miller',
      email: 'd.miller@apexlending.com',
      role: 'LOAN_OFFICER',
      active: true,
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'usr-3',
      workspaceId: ws1Id,
      name: 'Elena Ramos',
      email: 'e.ramos@apexlending.com',
      role: 'PROCESSOR',
      active: true,
      createdAt: '2026-02-01T08:30:00Z',
    },
    {
      id: 'usr-4',
      workspaceId: ws1Id,
      name: 'Marcus Vance',
      email: 'm.vance@apexlending.com',
      role: 'LOAN_OFFICER',
      active: true,
      createdAt: '2026-02-10T11:15:00Z',
    },
    // User in another workspace to verify tenant isolation
    {
      id: 'usr-isolated',
      workspaceId: ws2Id,
      name: 'Tom Bradley',
      email: 't.bradley@summitcoast.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-01-01T09:00:00Z',
    },
  ];

  const loans: Loan[] = [
    {
      id: 'loan-1',
      workspaceId: ws1Id,
      loanNumber: 'ML-2026-881',
      borrowerDisplayName: 'R. Davis & M. Davis',
      loanOfficerId: 'usr-2',
      loanOfficerName: 'David Miller',
      processorId: 'usr-3',
      processorName: 'Elena Ramos',
      stage: 'Blocked',
      loanAmount: 540000,
      propertyAddress: '742 Evergreen Terrace, Austin, TX 78704',
      propertyType: 'Single Family Residence',
      targetClosingDate: '2026-11-04',
      lenderName: 'United Wholesale Mortgage (UWM)',
      loanProgram: 'Conventional 30-Year Fixed (Purchase)',
      readinessScore: 68,
      hasBlockingExceptions: true,
      createdAt: '2026-10-01T14:22:00Z',
      updatedAt: '2026-10-19T16:45:00Z',
    },
    {
      id: 'loan-2',
      workspaceId: ws1Id,
      loanNumber: 'ML-2026-882',
      borrowerDisplayName: 'Carlos & Sofia Martinez',
      loanOfficerId: 'usr-4',
      loanOfficerName: 'Marcus Vance',
      processorId: 'usr-3',
      processorName: 'Elena Ramos',
      stage: 'In Progress',
      loanAmount: 385000,
      propertyAddress: '1204 Oak Ridge Dr, Phoenix, AZ 85016',
      propertyType: 'Condominium',
      targetClosingDate: '2026-11-15',
      lenderName: 'Pennymac Correspondent',
      loanProgram: 'FHA 30-Year Streamline Refinance',
      readinessScore: 82,
      hasBlockingExceptions: false,
      createdAt: '2026-10-05T10:10:00Z',
      updatedAt: '2026-10-18T11:20:00Z',
    },
    {
      id: 'loan-3',
      workspaceId: ws1Id,
      loanNumber: 'ML-2026-883',
      borrowerDisplayName: 'Aarav & Priya Patel',
      loanOfficerId: 'usr-2',
      loanOfficerName: 'David Miller',
      processorId: 'usr-3',
      processorName: 'Elena Ramos',
      stage: 'Ready for Broker Review',
      loanAmount: 980000,
      propertyAddress: '45 Marina Blvd, San Francisco, CA 94123',
      propertyType: 'Single Family Residence',
      targetClosingDate: '2026-10-28',
      lenderName: 'Rocket Pro TPO',
      loanProgram: 'Jumbo 30-Year Fixed (Purchase)',
      readinessScore: 96,
      hasBlockingExceptions: false,
      createdAt: '2026-09-28T09:40:00Z',
      updatedAt: '2026-10-20T08:15:00Z',
    },
    {
      id: 'loan-4',
      workspaceId: ws1Id,
      loanNumber: 'ML-2026-884',
      borrowerDisplayName: 'Major James Taylor',
      loanOfficerId: 'usr-4',
      loanOfficerName: 'Marcus Vance',
      processorId: 'usr-3',
      processorName: 'Elena Ramos',
      stage: 'Setup',
      loanAmount: 420000,
      propertyAddress: '882 Patriot Way, Colorado Springs, CO 80920',
      propertyType: 'Single Family Residence',
      targetClosingDate: '2026-11-28',
      lenderName: 'Freedom Mortgage',
      loanProgram: 'VA 30-Year Fixed (Purchase)',
      readinessScore: 40,
      hasBlockingExceptions: true,
      createdAt: '2026-10-15T15:30:00Z',
      updatedAt: '2026-10-19T14:10:00Z',
    },
    {
      id: 'loan-5',
      workspaceId: ws1Id,
      loanNumber: 'ML-2026-885',
      borrowerDisplayName: 'Evelyn Sterling',
      loanOfficerId: 'usr-2',
      loanOfficerName: 'David Miller',
      processorId: 'usr-3',
      processorName: 'Elena Ramos',
      stage: 'In Progress',
      loanAmount: 310000,
      propertyAddress: '311 Maple Ave, Charlotte, NC 28203',
      propertyType: 'Townhouse',
      targetClosingDate: '2026-12-05',
      lenderName: 'Plaza Home Mortgage',
      loanProgram: 'Conventional 15-Year Cash-Out Refinance',
      readinessScore: 74,
      hasBlockingExceptions: false,
      createdAt: '2026-10-12T13:00:00Z',
      updatedAt: '2026-10-19T10:00:00Z',
    },
    // Loan in another workspace to verify tenant isolation
    {
      id: 'loan-isolated',
      workspaceId: ws2Id,
      loanNumber: 'SUMMIT-109',
      borrowerDisplayName: 'Secret Isolated Borrower',
      loanOfficerId: 'usr-isolated',
      loanOfficerName: 'Tom Bradley',
      stage: 'Setup',
      loanAmount: 600000,
      propertyAddress: '100 Hidden Valley Rd, Seattle, WA',
      propertyType: 'Single Family',
      targetClosingDate: '2026-12-01',
      lenderName: 'Summit Capital',
      loanProgram: 'Conventional 30-Year',
      readinessScore: 30,
      hasBlockingExceptions: false,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const conditions: Condition[] = [
    // Loan 1 Conditions
    {
      id: 'c-101',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      title: 'Most Recent 2 Months Consecutive Bank Statements',
      description: 'Provide all pages (1-6) of Chase checking account verifying source of earnest money deposit and asset reserves.',
      source: 'Lender Initial',
      status: 'Needs Correction',
      ownerId: 'usr-3',
      ownerName: 'Elena Ramos',
      dueDate: '2026-10-24',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-19T14:30:00Z',
      linkedDocumentIds: ['doc-1'],
    },
    {
      id: 'c-102',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      title: 'Current 30-Day Paystubs for Both Borrowers',
      description: 'Most recent paystub reflecting year-to-date earnings for R. Davis (TechCorp) and M. Davis (HealthPartners).',
      source: 'Underwriting Prior to Doc',
      status: 'In Review',
      ownerId: 'usr-3',
      ownerName: 'Elena Ramos',
      dueDate: '2026-10-25',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-18T16:00:00Z',
      linkedDocumentIds: ['doc-2'],
    },
    {
      id: 'c-103',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      title: 'Homeowners Insurance Declaration Page & Escrow Receipt',
      description: 'Hazard insurance binder naming United Wholesale Mortgage ISAOA/ATIMA with min $540,000 dwelling coverage.',
      source: 'Closing Prior to Funding',
      status: 'Open',
      ownerId: 'usr-2',
      ownerName: 'David Miller',
      dueDate: '2026-10-29',
      createdAt: '2026-10-04T11:00:00Z',
      updatedAt: '2026-10-04T11:00:00Z',
      linkedDocumentIds: [],
    },
    {
      id: 'c-104',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      title: 'Signed Form 4506-C IRS Tax Transcript Request',
      description: 'Fully executed Form 4506-C for tax years 2024 and 2025 signed within 120 days.',
      source: 'Internal Broker',
      status: 'Resolved',
      ownerId: 'usr-3',
      ownerName: 'Elena Ramos',
      dueDate: '2026-10-15',
      resolvedAt: '2026-10-14T15:20:00Z',
      resolvedById: 'usr-3',
      resolutionNotes: 'Wet-signed and verified against 1040s; lender acknowledged receipt.',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-14T15:20:00Z',
      linkedDocumentIds: ['doc-3'],
    },

    // Loan 3 Conditions (Ready for Review)
    {
      id: 'c-301',
      workspaceId: ws1Id,
      loanId: 'loan-3',
      title: '2 Years Corporate Tax Returns (Form 1120S) & K-1s',
      description: 'Provide complete signed federal business returns including all statements and schedules for 2024 and 2025.',
      source: 'Underwriting Prior to Doc',
      status: 'Resolved',
      ownerId: 'usr-3',
      ownerName: 'Elena Ramos',
      dueDate: '2026-10-18',
      resolvedAt: '2026-10-18T11:00:00Z',
      resolvedById: 'usr-1',
      resolutionNotes: 'CPA letter attached, liquidity verified, underwriter signed off on cash flow schedule.',
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'c-302',
      workspaceId: ws1Id,
      loanId: 'loan-3',
      title: 'Preliminary Title Report & 24-Month Chain of Title',
      description: 'Title commitment showing clear vesting and standard exclusions.',
      source: 'Lender Initial',
      status: 'Resolved',
      ownerId: 'usr-3',
      ownerName: 'Elena Ramos',
      dueDate: '2026-10-19',
      resolvedAt: '2026-10-19T09:30:00Z',
      resolvedById: 'usr-3',
      resolutionNotes: 'First American Title commitment approved with no liens.',
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-19T09:30:00Z',
    },

    // Loan 4 Conditions (Setup)
    {
      id: 'c-401',
      workspaceId: ws1Id,
      loanId: 'loan-4',
      title: 'VA Certificate of Eligibility (COE)',
      description: 'Automated Certificate of Eligibility confirming full entitlement and zero funding fee exemption status.',
      source: 'Lender Initial',
      status: 'Open',
      ownerId: 'usr-4',
      ownerName: 'Marcus Vance',
      dueDate: '2026-10-22',
      createdAt: '2026-10-16T09:00:00Z',
      updatedAt: '2026-10-16T09:00:00Z',
      linkedDocumentIds: [],
    },
    {
      id: 'c-402',
      workspaceId: ws1Id,
      loanId: 'loan-4',
      title: 'DD-214 Member-4 Copy or Statement of Service',
      description: 'Standard military discharge record showing character of service as Honorable.',
      source: 'Internal Broker',
      status: 'Requested',
      ownerId: 'usr-4',
      ownerName: 'Marcus Vance',
      dueDate: '2026-10-23',
      createdAt: '2026-10-16T09:00:00Z',
      updatedAt: '2026-10-17T10:00:00Z',
      linkedDocumentIds: [],
    },
  ];

  const documents: Document[] = [
    {
      id: 'doc-1',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      filename: 'Chase_Checking_August_2026.pdf',
      originalName: 'Davis_Chase_Statement_Aug2026.pdf',
      docType: 'Bank Statement',
      fileSize: 1845200,
      mimeType: 'application/pdf',
      status: 'Review Required',
      uploadedById: 'usr-2',
      uploadedByName: 'David Miller',
      uploadedAt: '2026-10-19T11:15:00Z',
      version: 1,
      storagePath: '/uploads/loan-1/doc-1.pdf',
      extractedMetadata: {
        documentDate: '2026-08-31',
        pageCount: 5,
        borrowerName: 'Robert Davis',
        accountLast4: '4921',
        isAiExtracted: true,
        confidenceScore: 0.94,
        missingFields: ['Page 6 of 6 not detected in PDF stream'],
      },
    },
    {
      id: 'doc-2',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      filename: 'TechCorp_Paystub_Oct2026.pdf',
      originalName: 'R_Davis_Paystub_10152026.pdf',
      docType: 'Paystub',
      fileSize: 420100,
      mimeType: 'application/pdf',
      status: 'Processing',
      uploadedById: 'usr-3',
      uploadedByName: 'Elena Ramos',
      uploadedAt: '2026-10-19T14:00:00Z',
      version: 1,
      storagePath: '/uploads/loan-1/doc-2.pdf',
      extractedMetadata: {
        documentDate: '2026-10-15',
        pageCount: 2,
        borrowerName: 'Robert Davis',
        detectedIncome: 14583.33,
        isAiExtracted: true,
        confidenceScore: 0.98,
      },
    },
    {
      id: 'doc-3',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      filename: 'Signed_Form_4506C_Executed.pdf',
      originalName: 'Signed_4506C_Davis.pdf',
      docType: 'IRS Tax Transcript Request',
      fileSize: 310500,
      mimeType: 'application/pdf',
      status: 'Accepted for Requirement',
      uploadedById: 'usr-3',
      uploadedByName: 'Elena Ramos',
      uploadedAt: '2026-10-14T14:00:00Z',
      reviewerId: 'usr-3',
      reviewerName: 'Elena Ramos',
      reviewedAt: '2026-10-14T15:20:00Z',
      reviewerNotes: 'Verified wet signature matches driver license and 1003.',
      version: 1,
      storagePath: '/uploads/loan-1/doc-3.pdf',
      extractedMetadata: {
        documentDate: '2026-10-14',
        pageCount: 1,
        borrowerName: 'Robert Davis & Megan Davis',
        isAiExtracted: false,
      },
    },
    {
      id: 'doc-4',
      workspaceId: ws1Id,
      loanId: 'loan-2',
      filename: 'Martinez_W2_2025.pdf',
      originalName: '2025_W2_SofiaMartinez.pdf',
      docType: 'W2 Wage Statement',
      fileSize: 512000,
      mimeType: 'application/pdf',
      status: 'Accepted for Requirement',
      uploadedById: 'usr-4',
      uploadedByName: 'Marcus Vance',
      uploadedAt: '2026-10-16T09:40:00Z',
      reviewerId: 'usr-3',
      reviewerName: 'Elena Ramos',
      reviewedAt: '2026-10-17T11:00:00Z',
      reviewerNotes: 'EIN matches employer record, wages cross-verified with 1040.',
      version: 1,
      storagePath: '/uploads/loan-2/doc-4.pdf',
      extractedMetadata: {
        documentDate: '2026-01-20',
        pageCount: 1,
        borrowerName: 'Sofia Martinez',
        isAiExtracted: true,
        confidenceScore: 0.99,
      },
    },
    {
      id: 'doc-5',
      workspaceId: ws1Id,
      loanId: 'loan-2',
      filename: 'HOA_Condo_Questionnaire_Draft.pdf',
      originalName: 'Oak_Ridge_Condo_HOA_Cert.pdf',
      docType: 'HOA Certification',
      fileSize: 890000,
      mimeType: 'application/pdf',
      status: 'Review Required',
      uploadedById: 'usr-3',
      uploadedByName: 'Elena Ramos',
      uploadedAt: '2026-10-19T09:00:00Z',
      version: 1,
      storagePath: '/uploads/loan-2/doc-5.pdf',
      extractedMetadata: {
        documentDate: '2026-10-12',
        pageCount: 4,
        isAiExtracted: true,
        confidenceScore: 0.88,
        missingFields: ['Insurance policy expiration date is illegible in section 4'],
      },
    },
  ];

  const documentConditionLinks: DocumentConditionLink[] = [
    { id: 'dcl-1', documentId: 'doc-1', conditionId: 'c-101', createdAt: '2026-10-19T11:16:00Z' },
    { id: 'dcl-2', documentId: 'doc-2', conditionId: 'c-102', createdAt: '2026-10-19T14:01:00Z' },
    { id: 'dcl-3', documentId: 'doc-3', conditionId: 'c-104', createdAt: '2026-10-14T14:05:00Z' },
  ];

  const exceptions: Exception[] = [
    {
      id: 'exc-1',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      borrowerDisplayName: 'R. Davis & M. Davis',
      issue: 'Bank Statement missing final reconciliation page (Page 6 of 6)',
      evidence: 'Chase_Checking_August_2026.pdf indicates footer "Page 5 of 6". Only 5 pages present in file stream.',
      category: 'Page Completeness',
      severity: 'Urgent',
      severityReason: 'Underwriting will reject incomplete asset statement; closing scheduled in 12 days.',
      status: 'Open',
      isAiSuggested: false,
      responsibleUserId: 'usr-3',
      responsibleUserName: 'Elena Ramos',
      dueDate: '2026-10-22',
      recommendedAction: 'Contact borrower to re-download full multi-page PDF from Chase online banking portal without truncating ending pages.',
      createdAt: '2026-10-19T12:00:00Z',
      updatedAt: '2026-10-19T12:00:00Z',
    },
    {
      id: 'exc-2',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      borrowerDisplayName: 'R. Davis & M. Davis',
      issue: 'Hazard Insurance coverage declaration missing ISAOA/ATIMA loss payee clause',
      evidence: 'Condition c-103 has had zero documents uploaded for 15 days.',
      category: 'Requirement Coverage',
      severity: 'High',
      severityReason: 'Lender closing package cannot be drawn without active binder naming lender.',
      status: 'Assigned',
      isAiSuggested: false,
      responsibleUserId: 'usr-2',
      responsibleUserName: 'David Miller',
      dueDate: '2026-10-23',
      recommendedAction: 'Notify insurance agent (State Farm - Agent Mark Bell) to issue revised binder with exact mortgagee clause.',
      createdAt: '2026-10-18T10:30:00Z',
      updatedAt: '2026-10-19T09:15:00Z',
    },
    {
      id: 'exc-3',
      workspaceId: ws1Id,
      loanId: 'loan-2',
      loanNumber: 'ML-2026-882',
      borrowerDisplayName: 'Carlos & Sofia Martinez',
      issue: 'HOA master insurance policy section illegible on questionnaire',
      evidence: 'HOA_Condo_Questionnaire_Draft.pdf page 3 table lines blurred during scan.',
      category: 'File Integrity',
      severity: 'Normal',
      severityReason: 'Condo project approval requires readable master hazard policy limits.',
      status: 'Open',
      isAiSuggested: true,
      aiConfidence: 0.91,
      responsibleUserId: 'usr-3',
      responsibleUserName: 'Elena Ramos',
      dueDate: '2026-10-26',
      recommendedAction: 'Request direct electronic PDF from HOA management company instead of photo/scanner scan.',
      createdAt: '2026-10-19T09:15:00Z',
      updatedAt: '2026-10-19T09:15:00Z',
    },
    {
      id: 'exc-4',
      workspaceId: ws1Id,
      loanId: 'loan-4',
      loanNumber: 'ML-2026-884',
      borrowerDisplayName: 'Major James Taylor',
      issue: 'VA Certificate of Eligibility (COE) overdue for initial file submission',
      evidence: 'Condition c-401 due date expired yesterday with no document attached.',
      category: 'Condition Overdue',
      severity: 'High',
      severityReason: 'VA loan cannot proceed to underwriting without valid COE establishing entitlement.',
      status: 'Open',
      isAiSuggested: false,
      responsibleUserId: 'usr-4',
      responsibleUserName: 'Marcus Vance',
      dueDate: '2026-10-21',
      recommendedAction: 'Pull WebLGY automated COE via VA portal or submit DD-214 copy.',
      createdAt: '2026-10-20T07:00:00Z',
      updatedAt: '2026-10-20T07:00:00Z',
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-1',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      borrowerDisplayName: 'R. Davis & M. Davis',
      title: 'Obtain missing page 6 of Chase checking statement from Davis',
      description: 'Call borrower Robert Davis regarding missing ending reconciliation page on August statement.',
      assigneeId: 'usr-3',
      assigneeName: 'Elena Ramos',
      dueDate: '2026-10-21',
      priority: 'Urgent',
      status: 'In Progress',
      conditionId: 'c-101',
      documentId: 'doc-1',
      exceptionId: 'exc-1',
      createdAt: '2026-10-19T12:05:00Z',
      updatedAt: '2026-10-19T13:00:00Z',
    },
    {
      id: 'tsk-2',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      borrowerDisplayName: 'R. Davis & M. Davis',
      title: 'Request updated insurance binder with ISAOA clause from State Farm',
      description: 'Contact agent Mark Bell at 512-555-0199 for revised declaration page.',
      assigneeId: 'usr-2',
      assigneeName: 'David Miller',
      dueDate: '2026-10-22',
      priority: 'High',
      status: 'To Do',
      conditionId: 'c-103',
      exceptionId: 'exc-2',
      createdAt: '2026-10-18T11:00:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'tsk-3',
      workspaceId: ws1Id,
      loanId: 'loan-2',
      loanNumber: 'ML-2026-882',
      borrowerDisplayName: 'Carlos & Sofia Martinez',
      title: 'Order clean electronic copy of HOA Condo Questionnaire',
      description: 'Send request via Condocerts to Oak Ridge HOA Board.',
      assigneeId: 'usr-3',
      assigneeName: 'Elena Ramos',
      dueDate: '2026-10-24',
      priority: 'Normal',
      status: 'Waiting',
      documentId: 'doc-5',
      exceptionId: 'exc-3',
      createdAt: '2026-10-19T10:00:00Z',
      updatedAt: '2026-10-19T10:00:00Z',
    },
    {
      id: 'tsk-4',
      workspaceId: ws1Id,
      loanId: 'loan-4',
      loanNumber: 'ML-2026-884',
      borrowerDisplayName: 'Major James Taylor',
      title: 'Access VA WebLGY portal and retrieve COE',
      description: 'Log into VA portal using borrower SSN and military branch to download instant COE.',
      assigneeId: 'usr-4',
      assigneeName: 'Marcus Vance',
      dueDate: '2026-10-21',
      priority: 'High',
      status: 'To Do',
      conditionId: 'c-401',
      exceptionId: 'exc-4',
      createdAt: '2026-10-20T07:15:00Z',
      updatedAt: '2026-10-20T07:15:00Z',
    },
    {
      id: 'tsk-5',
      workspaceId: ws1Id,
      loanId: 'loan-3',
      loanNumber: 'ML-2026-883',
      borrowerDisplayName: 'Aarav & Priya Patel',
      title: 'Broker final sign-off and file readiness lock',
      description: 'Perform senior broker review of all completed conditions prior to drawing closing docs.',
      assigneeId: 'usr-1',
      assigneeName: 'Sarah Jenkins',
      dueDate: '2026-10-22',
      priority: 'Urgent',
      status: 'To Do',
      createdAt: '2026-10-20T08:30:00Z',
      updatedAt: '2026-10-20T08:30:00Z',
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'act-1',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      actorId: 'usr-3',
      actorName: 'Elena Ramos',
      actorRole: 'PROCESSOR',
      action: 'EXCEPTION_FLAGGED',
      entityType: 'EXCEPTION',
      entityId: 'exc-1',
      details: 'Flagged missing reconciliation page 6 on Chase checking statement',
      timestamp: '2026-10-19T12:00:00Z',
    },
    {
      id: 'act-2',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      actorId: 'usr-2',
      actorName: 'David Miller',
      actorRole: 'LOAN_OFFICER',
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: 'doc-1',
      details: 'Uploaded Chase_Checking_August_2026.pdf (1.8MB) for borrower review',
      timestamp: '2026-10-19T11:15:00Z',
    },
    {
      id: 'act-3',
      workspaceId: ws1Id,
      loanId: 'loan-3',
      loanNumber: 'ML-2026-883',
      actorId: 'usr-1',
      actorName: 'Sarah Jenkins',
      actorRole: 'ADMIN',
      action: 'STAGE_UPDATED',
      entityType: 'LOAN',
      entityId: 'loan-3',
      details: 'Advanced loan stage to "Ready for Broker Review" following condition clearance',
      timestamp: '2026-10-20T08:15:00Z',
    },
    {
      id: 'act-4',
      workspaceId: ws1Id,
      loanId: 'loan-1',
      loanNumber: 'ML-2026-881',
      actorId: 'usr-3',
      actorName: 'Elena Ramos',
      actorRole: 'PROCESSOR',
      action: 'CONDITION_RESOLVED',
      entityType: 'CONDITION',
      entityId: 'c-104',
      details: 'Resolved condition "Signed Form 4506-C IRS Tax Transcript Request" with human review notes',
      timestamp: '2026-10-14T15:20:00Z',
    },
  ];

  const settings: SystemSettings[] = [
    {
      workspaceId: ws1Id,
      brokerageName: 'Apex Lending Partners LLC',
      nmlsId: '1948201',
      contactEmail: 'operations@apexlending.com',
      phone: '(512) 555-8900',
      timezone: 'America/Chicago (CST)',
      aiProvider: 'deterministic',
      aiModel: 'gpt-4o-mortgage-readiness',
      hasApiKey: false,
      minConfidenceThreshold: 85,
      dataRetentionDays: 2555, // 7 years mortgage compliance
      emailAlertsEnabled: true,
    },
    {
      workspaceId: ws2Id,
      brokerageName: 'Summit Coast Mortgage Corp',
      nmlsId: '2084912',
      contactEmail: 'admin@summitcoast.com',
      phone: '(206) 555-3120',
      timezone: 'America/Los_Angeles (PST)',
      aiProvider: 'deterministic',
      aiModel: 'claude-3-5-sonnet',
      hasApiKey: false,
      minConfidenceThreshold: 80,
      dataRetentionDays: 2555,
      emailAlertsEnabled: true,
    },
  ];

  return {
    workspaces: [
      {
        id: ws1Id,
        name: 'Apex Lending Partners',
        nmlsId: '1948201',
        contactEmail: 'operations@apexlending.com',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: ws2Id,
        name: 'Summit Coast Mortgage',
        nmlsId: '2084912',
        contactEmail: 'admin@summitcoast.com',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    users,
    loans,
    conditions,
    documents,
    documentConditionLinks,
    exceptions,
    tasks,
    activityLogs,
    settings,
    forms: [],
    formSubmissions: [],
  };
}

// Ensure DB directory exists and read data
function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.forms) parsed.forms = [];
    if (!parsed.formSubmissions) parsed.formSubmissions = [];

    // Seed default intake form if none exist
    if (parsed.forms.length === 0) {
      parsed.forms.push({
        id: 'form-intake-1',
        workspaceId: 'ws-apex-101',
        title: 'Mortgage Pre-Approval & Refinance Intake',
        slug: 'pre-approval-intake',
        description: 'Collect borrower financing requirements and property details for instant readiness review.',
        notificationEmail: 'operations@apexlending.com',
        status: 'Published',
        submissionsCount: 2,
        createdAt: '2026-10-10T10:00:00Z',
        updatedAt: '2026-10-18T12:00:00Z',
        fields: [
          { id: 'f-1', type: 'text', label: 'Full Legal Name(s)', placeholder: 'e.g. John & Jane Doe', required: true },
          { id: 'f-2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
          { id: 'f-3', type: 'tel', label: 'Phone Number', placeholder: '(555) 123-4567', required: true },
          {
            id: 'f-4',
            type: 'select',
            label: 'Loan Purpose & Program',
            required: true,
            options: [
              'Conventional 30-Year Fixed (Purchase)',
              'FHA 30-Year Loan',
              'VA Loan (Veteran Benefit)',
              'Jumbo Financing',
              'Rate & Term Refinance',
              'Cash-Out Refinance'
            ]
          },
          { id: 'f-5', type: 'number', label: 'Requested Loan Amount ($)', placeholder: '450000', required: true },
          { id: 'f-6', type: 'text', label: 'Subject Property Address', placeholder: '123 Main St, Austin TX', required: false },
          {
            id: 'f-7',
            type: 'select',
            label: 'Estimated Credit Score Range',
            required: false,
            options: ['Excellent (740+)', 'Good (680 - 739)', 'Fair (620 - 679)', 'Building Credit (< 620)']
          },
          { id: 'f-8', type: 'textarea', label: 'Notes or Special Questions', placeholder: 'Any additional details...', required: false }
        ]
      });
      saveDatabase(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error reading database file, resetting to initial seed:', err);
    const initialData = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

// Atomically save DB
function saveDatabase(db: DatabaseSchema): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Workspaces
export function getWorkspaces(): Workspace[] {
  const db = getDatabase();
  return db.workspaces;
}

export function getWorkspaceById(id: string): Workspace | undefined {
  const db = getDatabase();
  return db.workspaces.find((w) => w.id === id);
}

// Users
export function getUsers(workspaceId: string): User[] {
  const db = getDatabase();
  return db.users.filter((u) => u.workspaceId === workspaceId && u.active);
}

export function getAllUsers(workspaceId: string): User[] {
  const db = getDatabase();
  return db.users.filter((u) => u.workspaceId === workspaceId);
}

export function getUserById(workspaceId: string, id: string): User | undefined {
  const db = getDatabase();
  return db.users.find((u) => u.workspaceId === workspaceId && u.id === id);
}

export function createUser(workspaceId: string, user: Omit<User, 'id' | 'workspaceId' | 'createdAt'>): User {
  const db = getDatabase();
  const newUser: User = {
    ...user,
    id: `usr-${Date.now()}`,
    workspaceId,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
}

export function updateUser(workspaceId: string, id: string, updates: Partial<User>): User | null {
  const db = getDatabase();
  const idx = db.users.findIndex((u) => u.workspaceId === workspaceId && u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  saveDatabase(db);
  return db.users[idx];
}

export function deleteUser(workspaceId: string, id: string): boolean {
  const db = getDatabase();
  const prevLen = db.users.length;
  db.users = db.users.filter((u) => !(u.workspaceId === workspaceId && u.id === id));
  saveDatabase(db);
  return db.users.length < prevLen;
}

export function generateDefault1003(loan: Loan): Form1003Data {
  const isRefi = (loan.loanProgram || '').toLowerCase().includes('refinance');
  const baseIncome = Math.max(7500, Math.round(loan.loanAmount / 38));
  const purchasePrice = isRefi ? Math.round(loan.loanAmount * 1.35) : Math.round(loan.loanAmount * 1.25);
  const ltv = Math.round((loan.loanAmount / purchasePrice) * 100);

  return {
    borrower: {
      fullName: loan.borrowerDisplayName,
      ssn: `***-**-${Math.floor(1000 + Math.random() * 9000)}`,
      dob: '1984-06-14',
      maritalStatus: loan.borrowerDisplayName.includes('&') ? 'Married' : 'Unmarried',
      dependentsCount: 1,
      phone: '(512) 555-0199',
      email: `${loan.borrowerDisplayName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '') || 'borrower'}@clientmail.com`,
      currentAddress: loan.propertyAddress || '742 Evergreen Terrace, Austin, TX 78701',
      yearsAtAddress: 4.5,
      housingStatus: isRefi ? 'Own' : 'Rent',
    },
    employment: {
      employerName: 'Apex Technology Group LLC',
      jobTitle: 'Senior Infrastructure Engineer',
      yearsOnJob: 5.2,
      selfEmployed: false,
      monthlyBaseIncome: baseIncome,
      monthlyOvertime: 0,
      monthlyBonus: 850,
      totalMonthlyIncome: baseIncome + 850,
    },
    assets: {
      checkingBalance: Math.round(loan.loanAmount * 0.08),
      savingsBalance: Math.round(loan.loanAmount * 0.12),
      retirement401k: Math.round(loan.loanAmount * 0.35),
      otherAssets: 12500,
      totalAssets: Math.round(loan.loanAmount * 0.55) + 12500,
    },
    liabilities: {
      creditCardsBalance: 3200,
      creditCardsMonthlyPayment: 110,
      autoLoanBalance: 16800,
      autoLoanMonthlyPayment: 420,
      studentLoansBalance: 11500,
      studentLoansMonthlyPayment: 180,
      totalMonthlyDebt: 710,
      dtiRatio: 33.8,
    },
    propertyAndLoan: {
      loanPurpose: isRefi ? 'Refinance' : 'Purchase',
      propertyAddress: loan.propertyAddress,
      propertyType: loan.propertyType,
      occupancy: 'Primary Residence',
      purchasePrice,
      loanAmount: loan.loanAmount,
      ltvRatio: ltv,
      interestRate: 6.375,
      loanTermMonths: 360,
    },
    declarations: {
      outstandingJudgments: false,
      declaredBankruptcyPast7Years: false,
      propertyForeclosedPast7Years: false,
      partyToLawsuit: false,
      presentlyDelinquentOnFederalDebt: false,
      usCitizen: true,
      permanentResident: false,
      primaryResidenceIntent: true,
    },
  };
}

// Loans
export function getLoans(workspaceId: string): Loan[] {
  const db = getDatabase();
  return db.loans.filter((l) => l.workspaceId === workspaceId);
}

export function getLoanById(workspaceId: string, id: string): Loan | undefined {
  const db = getDatabase();
  const loan = db.loans.find((l) => l.workspaceId === workspaceId && l.id === id);
  if (loan && !loan.form1003) {
    loan.form1003 = generateDefault1003(loan);
  }
  return loan;
}

export function createLoan(workspaceId: string, loanData: Omit<Loan, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'readinessScore' | 'hasBlockingExceptions'>): Loan {
  const db = getDatabase();
  const newLoan: Loan = {
    ...loanData,
    id: `loan-${Date.now()}`,
    workspaceId,
    readinessScore: 50,
    hasBlockingExceptions: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.loans.push(newLoan);
  saveDatabase(db);
  return newLoan;
}

export function updateLoan(workspaceId: string, id: string, updates: Partial<Loan>): Loan | null {
  const db = getDatabase();
  const idx = db.loans.findIndex((l) => l.workspaceId === workspaceId && l.id === id);
  if (idx === -1) return null;
  db.loans[idx] = { ...db.loans[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  return db.loans[idx];
}

// Conditions
export function getConditions(workspaceId: string, loanId?: string): Condition[] {
  const db = getDatabase();
  return db.conditions.filter((c) => {
    if (c.workspaceId !== workspaceId) return false;
    if (loanId && c.loanId !== loanId) return false;
    return true;
  });
}

export function getConditionById(workspaceId: string, id: string): Condition | undefined {
  const db = getDatabase();
  return db.conditions.find((c) => c.workspaceId === workspaceId && c.id === id);
}

export function createCondition(workspaceId: string, data: Omit<Condition, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>): Condition {
  const db = getDatabase();
  const newCondition: Condition = {
    ...data,
    id: `c-${Date.now()}`,
    workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedDocumentIds: data.linkedDocumentIds || [],
  };
  db.conditions.push(newCondition);
  saveDatabase(db);
  return newCondition;
}

export function updateCondition(workspaceId: string, id: string, updates: Partial<Condition>): Condition | null {
  const db = getDatabase();
  const idx = db.conditions.findIndex((c) => c.workspaceId === workspaceId && c.id === id);
  if (idx === -1) return null;
  db.conditions[idx] = { ...db.conditions[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  return db.conditions[idx];
}

// Documents
export function getDocuments(workspaceId: string, loanId?: string): Document[] {
  const db = getDatabase();
  return db.documents.filter((d) => {
    if (d.workspaceId !== workspaceId) return false;
    if (loanId && d.loanId !== loanId) return false;
    return true;
  });
}

export function getDocumentById(workspaceId: string, id: string): Document | undefined {
  const db = getDatabase();
  return db.documents.find((d) => d.workspaceId === workspaceId && d.id === id);
}

export function createDocument(workspaceId: string, docData: Omit<Document, 'id' | 'workspaceId' | 'uploadedAt' | 'version'>): Document {
  const db = getDatabase();
  const newDoc: Document = {
    ...docData,
    id: `doc-${Date.now()}`,
    workspaceId,
    version: 1,
    uploadedAt: new Date().toISOString(),
  };
  db.documents.push(newDoc);
  saveDatabase(db);
  return newDoc;
}

export function updateDocument(workspaceId: string, id: string, updates: Partial<Document>): Document | null {
  const db = getDatabase();
  const idx = db.documents.findIndex((d) => d.workspaceId === workspaceId && d.id === id);
  if (idx === -1) return null;
  db.documents[idx] = { ...db.documents[idx], ...updates };
  saveDatabase(db);
  return db.documents[idx];
}

// Document-Condition Links
export function linkDocumentToCondition(documentId: string, conditionId: string): DocumentConditionLink {
  const db = getDatabase();
  // Check if link exists
  const existing = db.documentConditionLinks.find(
    (l) => l.documentId === documentId && l.conditionId === conditionId
  );
  if (existing) return existing;

  const newLink: DocumentConditionLink = {
    id: `dcl-${Date.now()}`,
    documentId,
    conditionId,
    createdAt: new Date().toISOString(),
  };
  db.documentConditionLinks.push(newLink);

  // Also update condition linkedDocumentIds array
  const condIdx = db.conditions.findIndex((c) => c.id === conditionId);
  if (condIdx !== -1) {
    const list = db.conditions[condIdx].linkedDocumentIds || [];
    if (!list.includes(documentId)) {
      db.conditions[condIdx].linkedDocumentIds = [...list, documentId];
    }
  }

  saveDatabase(db);
  return newLink;
}

export function unlinkDocumentFromCondition(documentId: string, conditionId: string): void {
  const db = getDatabase();
  db.documentConditionLinks = db.documentConditionLinks.filter(
    (l) => !(l.documentId === documentId && l.conditionId === conditionId)
  );
  const condIdx = db.conditions.findIndex((c) => c.id === conditionId);
  if (condIdx !== -1 && db.conditions[condIdx].linkedDocumentIds) {
    db.conditions[condIdx].linkedDocumentIds = db.conditions[condIdx].linkedDocumentIds?.filter(
      (id) => id !== documentId
    );
  }
  saveDatabase(db);
}

// Exceptions
export function getExceptions(workspaceId: string, loanId?: string): Exception[] {
  const db = getDatabase();
  return db.exceptions.filter((e) => {
    if (e.workspaceId !== workspaceId) return false;
    if (loanId && e.loanId !== loanId) return false;
    return true;
  });
}

export function getExceptionById(workspaceId: string, id: string): Exception | undefined {
  const db = getDatabase();
  return db.exceptions.find((e) => e.workspaceId === workspaceId && e.id === id);
}

export function createException(workspaceId: string, excData: Omit<Exception, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>): Exception {
  const db = getDatabase();
  const newExc: Exception = {
    ...excData,
    id: `exc-${Date.now()}`,
    workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.exceptions.push(newExc);
  saveDatabase(db);
  return newExc;
}

export function updateException(workspaceId: string, id: string, updates: Partial<Exception>): Exception | null {
  const db = getDatabase();
  const idx = db.exceptions.findIndex((e) => e.workspaceId === workspaceId && e.id === id);
  if (idx === -1) return null;
  db.exceptions[idx] = { ...db.exceptions[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  return db.exceptions[idx];
}

// Tasks
export function getTasks(workspaceId: string, loanId?: string): Task[] {
  const db = getDatabase();
  return db.tasks.filter((t) => {
    if (t.workspaceId !== workspaceId) return false;
    if (loanId && t.loanId !== loanId) return false;
    return true;
  });
}

export function getTaskById(workspaceId: string, id: string): Task | undefined {
  const db = getDatabase();
  return db.tasks.find((t) => t.workspaceId === workspaceId && t.id === id);
}

export function createTask(workspaceId: string, taskData: Omit<Task, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>): Task {
  const db = getDatabase();
  const newTask: Task = {
    ...taskData,
    id: `tsk-${Date.now()}`,
    workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.tasks.push(newTask);
  saveDatabase(db);
  return newTask;
}

export function updateTask(workspaceId: string, id: string, updates: Partial<Task>): Task | null {
  const db = getDatabase();
  const idx = db.tasks.findIndex((t) => t.workspaceId === workspaceId && t.id === id);
  if (idx === -1) return null;
  db.tasks[idx] = { ...db.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  return db.tasks[idx];
}

// Activity Logs
export function getActivityLogs(workspaceId: string, loanId?: string, limit = 50): ActivityLog[] {
  const db = getDatabase();
  const filtered = db.activityLogs.filter((a) => {
    if (a.workspaceId !== workspaceId) return false;
    if (loanId && a.loanId !== loanId) return false;
    return true;
  });
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

export function logActivity(
  workspaceId: string,
  entry: Omit<ActivityLog, 'id' | 'workspaceId' | 'timestamp'>
): ActivityLog {
  const db = getDatabase();
  const newLog: ActivityLog = {
    ...entry,
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workspaceId,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs.unshift(newLog);
  saveDatabase(db);
  return newLog;
}

// Settings
export function getSettings(workspaceId: string): SystemSettings {
  const db = getDatabase();
  const s = db.settings.find((item) => item.workspaceId === workspaceId);
  if (s) return s;
  const defaultSetting: SystemSettings = {
    workspaceId,
    brokerageName: 'Mortgage Brokerage',
    nmlsId: '000000',
    contactEmail: 'contact@brokerage.com',
    phone: '(555) 000-0000',
    timezone: 'America/New_York (EST)',
    aiProvider: 'deterministic',
    aiModel: 'standard-rule-engine',
    hasApiKey: false,
    minConfidenceThreshold: 80,
    dataRetentionDays: 2555,
    emailAlertsEnabled: true,
  };
  db.settings.push(defaultSetting);
  saveDatabase(db);
  return defaultSetting;
}

export function updateSettings(workspaceId: string, updates: Partial<SystemSettings>): SystemSettings {
  const db = getDatabase();
  const idx = db.settings.findIndex((item) => item.workspaceId === workspaceId);
  if (idx === -1) {
    const fresh = { ...getSettings(workspaceId), ...updates };
    db.settings.push(fresh);
    saveDatabase(db);
    return fresh;
  }
  db.settings[idx] = { ...db.settings[idx], ...updates };
  saveDatabase(db);
  return db.settings[idx];
}

// Recalculate loan readiness score & blocking exception flag
export function recalculateLoanReadiness(workspaceId: string, loanId: string): Loan | null {
  const db = getDatabase();
  const loanIdx = db.loans.findIndex((l) => l.workspaceId === workspaceId && l.id === loanId);
  if (loanIdx === -1) return null;

  const conditions = db.conditions.filter((c) => c.workspaceId === workspaceId && c.loanId === loanId);
  const openExceptions = db.exceptions.filter(
    (e) => e.workspaceId === workspaceId && e.loanId === loanId && (e.status === 'Open' || e.status === 'Assigned' || e.status === 'In Progress')
  );

  const urgentBlocking = openExceptions.some((e) => e.severity === 'Urgent' || e.severity === 'High');

  let score = 100;
  if (conditions.length > 0) {
    const resolvedCount = conditions.filter((c) => c.status === 'Resolved').length;
    const condPercent = (resolvedCount / conditions.length) * 70; // 70% weighted to conditions
    score = Math.round(condPercent);
  } else {
    score = 60;
  }

  // Deduct for open exceptions
  const exceptionDeduction = openExceptions.reduce((acc, exc) => {
    if (exc.severity === 'Urgent') return acc + 15;
    if (exc.severity === 'High') return acc + 10;
    if (exc.severity === 'Normal') return acc + 5;
    return acc + 2;
  }, 0);

  score = Math.max(10, Math.min(100, score + 30 - exceptionDeduction));

  // Determine stage recommendation if appropriate
  let currentStage = db.loans[loanIdx].stage;
  if (currentStage !== 'Archived') {
    if (urgentBlocking && currentStage !== 'Setup') {
      currentStage = 'Blocked';
    } else if (score >= 95 && conditions.every((c) => c.status === 'Resolved') && openExceptions.length === 0) {
      currentStage = 'Ready for Broker Review';
    } else if (currentStage === 'Blocked' && !urgentBlocking) {
      currentStage = 'In Progress';
    }
  }

  db.loans[loanIdx].readinessScore = score;
  db.loans[loanIdx].hasBlockingExceptions = urgentBlocking;
  db.loans[loanIdx].stage = currentStage;
  db.loans[loanIdx].updatedAt = new Date().toISOString();

  saveDatabase(db);
  return db.loans[loanIdx];
}

// Custom Forms & Submissions
export function getForms(workspaceId: string): CustomForm[] {
  const db = getDatabase();
  return (db.forms || []).filter((f) => f.workspaceId === workspaceId);
}

export function getFormById(workspaceId: string, id: string): CustomForm | undefined {
  const db = getDatabase();
  return (db.forms || []).find((f) => f.workspaceId === workspaceId && f.id === id);
}

export function getFormBySlugOrId(idOrSlug: string): CustomForm | undefined {
  const db = getDatabase();
  return (db.forms || []).find((f) => f.id === idOrSlug || f.slug === idOrSlug);
}

export function createCustomForm(
  workspaceId: string,
  data: Omit<CustomForm, 'id' | 'workspaceId' | 'submissionsCount' | 'createdAt' | 'updatedAt'>
): CustomForm {
  const db = getDatabase();
  const newForm: CustomForm = {
    ...data,
    id: `form-${Date.now()}`,
    workspaceId,
    submissionsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.forms.push(newForm);
  saveDatabase(db);
  return newForm;
}

export function updateCustomForm(workspaceId: string, id: string, updates: Partial<CustomForm>): CustomForm | null {
  const db = getDatabase();
  const idx = db.forms.findIndex((f) => f.workspaceId === workspaceId && f.id === id);
  if (idx === -1) return null;
  db.forms[idx] = { ...db.forms[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  return db.forms[idx];
}

export function deleteCustomForm(workspaceId: string, id: string): boolean {
  const db = getDatabase();
  const prevLen = db.forms.length;
  db.forms = db.forms.filter((f) => !(f.workspaceId === workspaceId && f.id === id));
  saveDatabase(db);
  return db.forms.length < prevLen;
}

export function submitCustomForm(
  idOrSlug: string,
  formData: Record<string, any>
): { submission: FormSubmission; loan: Loan; form: CustomForm } | null {
  const db = getDatabase();
  const form = (db.forms || []).find((f) => f.id === idOrSlug || f.slug === idOrSlug);
  if (!form) return null;

  const borrowerName = formData.fullName || formData.name || formData.borrowerName || 'New Borrower Lead';
  const borrowerEmail = formData.email || 'borrower@client.com';
  const borrowerPhone = formData.phone || formData.tel;
  const loanAmount = Number(formData.loanAmount || formData.amount || 400000);
  const loanProgram = formData.loanPurpose || formData.loanProgram || 'Conventional 30-Year Fixed';
  const propertyAddress = formData.propertyAddress || formData.address || 'Address pending verification';

  // 1. Create Loan in DB
  const loanNumber = `ML-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newLoan: Loan = {
    id: `loan-${Date.now()}`,
    workspaceId: form.workspaceId,
    loanNumber,
    borrowerDisplayName: borrowerName,
    loanOfficerId: 'usr-2',
    loanOfficerName: 'David Miller',
    processorId: 'usr-3',
    processorName: 'Elena Ramos',
    stage: 'Setup',
    loanAmount,
    propertyAddress,
    propertyType: formData.propertyType || 'Single Family Residence',
    targetClosingDate: formData.targetClosingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    lenderName: 'TBD Wholesale Underwriting',
    loanProgram,
    readinessScore: 40,
    hasBlockingExceptions: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Populate Form 1003 (URLA) directly from the client's submitted lead form
  const custom1003 = generateDefault1003(newLoan);
  if (formData.email) custom1003.borrower.email = formData.email;
  if (formData.phone || formData.tel) custom1003.borrower.phone = formData.phone || formData.tel;
  if (formData.income || formData.monthlyIncome) {
    const inc = Number(formData.income || formData.monthlyIncome);
    custom1003.employment.monthlyBaseIncome = inc;
    custom1003.employment.totalMonthlyIncome = inc;
  }
  newLoan.form1003 = custom1003;

  db.loans.push(newLoan);

  // 2. Increment submission count & create record
  form.submissionsCount = (form.submissionsCount || 0) + 1;
  form.updatedAt = new Date().toISOString();

  const submission: FormSubmission = {
    id: `sub-${Date.now()}`,
    formId: form.id,
    workspaceId: form.workspaceId,
    loanId: newLoan.id,
    borrowerName,
    borrowerEmail,
    borrowerPhone,
    loanAmount,
    data: formData,
    submittedAt: new Date().toISOString(),
    notificationSentTo: form.notificationEmail,
  };
  db.formSubmissions.push(submission);

  // 3. Log audit activity
  logActivity(form.workspaceId, {
    loanId: newLoan.id,
    loanNumber: newLoan.loanNumber,
    actorId: 'usr-form-intake',
    actorName: `${borrowerName} (Online Form Lead)`,
    actorRole: 'PROCESSOR',
    action: 'LOAN_CREATED',
    entityType: 'LOAN',
    entityId: newLoan.id,
    details: `Form submission via "${form.title}" -> Created loan ${newLoan.loanNumber}. Notification emailed to ${form.notificationEmail}`,
  });

  saveDatabase(db);
  return { submission, loan: newLoan, form };
}
