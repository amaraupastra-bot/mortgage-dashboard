export type UserRole = 'ADMIN' | 'LOAN_OFFICER' | 'PROCESSOR';

export type LoanStage = 
  | 'Setup'
  | 'In Progress'
  | 'Blocked'
  | 'Ready for Broker Review'
  | 'Archived';

export type ConditionStatus = 
  | 'Open'
  | 'Requested'
  | 'Received'
  | 'In Review'
  | 'Needs Correction'
  | 'Resolved';

export type ConditionSource = 'Lender Initial' | 'Underwriting Prior to Doc' | 'Closing Prior to Funding' | 'Internal Broker';

export type DocumentStatus = 
  | 'Uploaded'
  | 'Processing'
  | 'Review Required'
  | 'Accepted for Requirement'
  | 'Rejected'
  | 'Superseded';

export type ExceptionStatus = 
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Dismissed';

export type ExceptionSeverity = 'Urgent' | 'High' | 'Normal' | 'Low';

export type ExceptionCategory = 
  | 'File Integrity'
  | 'Page Completeness'
  | 'Date Range Mismatch'
  | 'Missing Required Field'
  | 'Requirement Coverage'
  | 'Condition Overdue'
  | 'AI Suggested Anomaly';

export type TaskStatus = 
  | 'To Do'
  | 'In Progress'
  | 'Waiting'
  | 'Completed'
  | 'Cancelled';

export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export interface Workspace {
  id: string;
  name: string;
  nmlsId: string;
  contactEmail: string;
  createdAt: string;
}

export interface User {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface Form1003Data {
  borrower: {
    fullName: string;
    ssn: string;
    dob: string;
    maritalStatus: 'Married' | 'Unmarried' | 'Separated';
    dependentsCount: number;
    phone: string;
    email: string;
    currentAddress: string;
    yearsAtAddress: number;
    housingStatus: 'Own' | 'Rent' | 'Living with family';
  };
  employment: {
    employerName: string;
    jobTitle: string;
    yearsOnJob: number;
    selfEmployed: boolean;
    monthlyBaseIncome: number;
    monthlyOvertime: number;
    monthlyBonus: number;
    totalMonthlyIncome: number;
  };
  assets: {
    checkingBalance: number;
    savingsBalance: number;
    retirement401k: number;
    otherAssets: number;
    totalAssets: number;
  };
  liabilities: {
    creditCardsBalance: number;
    creditCardsMonthlyPayment: number;
    autoLoanBalance: number;
    autoLoanMonthlyPayment: number;
    studentLoansBalance: number;
    studentLoansMonthlyPayment: number;
    totalMonthlyDebt: number;
    dtiRatio: number;
  };
  propertyAndLoan: {
    loanPurpose: 'Purchase' | 'Refinance' | 'Cash-Out Refinance';
    propertyAddress: string;
    propertyType: string;
    occupancy: 'Primary Residence' | 'Second Home' | 'Investment Property';
    purchasePrice: number;
    loanAmount: number;
    ltvRatio: number;
    interestRate: number;
    loanTermMonths: number;
  };
  declarations: {
    outstandingJudgments: boolean;
    declaredBankruptcyPast7Years: boolean;
    propertyForeclosedPast7Years: boolean;
    partyToLawsuit: boolean;
    presentlyDelinquentOnFederalDebt: boolean;
    usCitizen: boolean;
    permanentResident: boolean;
    primaryResidenceIntent: boolean;
  };
}

export interface Loan {
  id: string;
  workspaceId: string;
  loanNumber: string; // e.g. "ML-2026-881"
  borrowerDisplayName: string; // e.g. "R. Davis & M. Davis"
  loanOfficerId: string;
  processorId?: string;
  loanOfficerName?: string;
  processorName?: string;
  stage: LoanStage;
  loanAmount: number;
  propertyAddress: string;
  propertyType: string;
  targetClosingDate: string; // YYYY-MM-DD
  lenderName: string;
  loanProgram: string;
  readinessScore: number; // 0-100 calculated
  hasBlockingExceptions: boolean;
  form1003?: Form1003Data;
  createdAt: string;
  updatedAt: string;
}

export interface Condition {
  id: string;
  workspaceId: string;
  loanId: string;
  title: string;
  description: string;
  source: ConditionSource;
  status: ConditionStatus;
  ownerId?: string;
  ownerName?: string;
  dueDate: string;
  resolvedAt?: string;
  resolvedById?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  linkedDocumentIds?: string[];
}

export interface Document {
  id: string;
  workspaceId: string;
  loanId: string;
  filename: string;
  originalName: string;
  docType: string; // e.g. "W2", "Paystub", "Bank Statement", "Appraisal", "Tax Return"
  fileSize: number; // in bytes
  mimeType: string;
  status: DocumentStatus;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  version: number;
  supersededById?: string;
  storagePath: string;
  extractedMetadata?: {
    documentDate?: string;
    pageCount?: number;
    borrowerName?: string;
    detectedIncome?: number;
    accountLast4?: string;
    confidenceScore?: number;
    isAiExtracted?: boolean;
    missingFields?: string[];
  };
}

export interface DocumentConditionLink {
  id: string;
  documentId: string;
  conditionId: string;
  createdAt: string;
}

export interface Exception {
  id: string;
  workspaceId: string;
  loanId: string;
  loanNumber: string;
  borrowerDisplayName: string;
  issue: string;
  evidence: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  severityReason: string;
  status: ExceptionStatus;
  isAiSuggested: boolean;
  aiConfidence?: number;
  responsibleUserId?: string;
  responsibleUserName?: string;
  dueDate?: string;
  recommendedAction: string;
  reviewerDecision?: 'Confirmed' | 'Dismissed' | 'Modified';
  reviewerNotes?: string;
  resolvedAt?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolutionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  loanId: string;
  loanNumber: string;
  borrowerDisplayName: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  conditionId?: string;
  documentId?: string;
  exceptionId?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  loanId?: string;
  loanNumber?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'LOAN' | 'CONDITION' | 'DOCUMENT' | 'EXCEPTION' | 'TASK' | 'USER' | 'SETTINGS';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  workspaceId: string;
  brokerageName: string;
  nmlsId: string;
  contactEmail: string;
  phone: string;
  timezone: string;
  aiProvider: 'deterministic' | 'openai' | 'anthropic';
  aiModel: string;
  hasApiKey: boolean;
  minConfidenceThreshold: number;
  dataRetentionDays: number;
  emailAlertsEnabled: boolean;
}
export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'select' | 'radio' | 'date' | 'heading' | 'divider';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  width?: 'full' | 'half';
  options?: string[];
  defaultValue?: string;
}

export interface FormTheme {
  primaryColor: string;
  buttonText: string;
  buttonSize: 'sm' | 'md' | 'lg';
  buttonRadius: 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-full';
  cardStyle: 'bordered' | 'shadow' | 'flat';
}

export interface CustomForm {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  description: string;
  notificationEmail: string; // The email where submissions & alerts are sent
  status: 'Published' | 'Draft';
  theme?: FormTheme;
  fields: FormField[];
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  workspaceId: string;
  loanId?: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone?: string;
  loanAmount: number;
  data: Record<string, any>;
  submittedAt: string;
  notificationSentTo: string;
}
