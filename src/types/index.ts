export type Role = 'teacher' | 'admin' | 'director';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  country?: string;
  city?: string;
  profession?: string;
  role: Role;
  created_at: string;
}

export interface SchoolHeaderConfig {
  republicTitle?: string;
  motto?: string;
  ministry?: string;
  direction?: string;
  inspection?: string;
  schoolName?: string;
  subTitle?: string;
  postalBox?: string;
  phone?: string;
  email?: string;
  city?: string;
  academicYear?: string;
  logoIcon?: string;
  logoUrl?: string;
  style?: 'classic' | 'modern' | 'centered';
  showBorders?: boolean;
}

export interface School {
  id: string;
  owner_id: string;
  name: string;
  short_name?: string;
  type: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  director?: string;
  year_label?: string;
  header_config?: SchoolHeaderConfig;
  created_at: string;
}

export type CycleKey = 'primaire' | 'college' | 'lycee' | 'technique';

export interface ClassRoom {
  id: string;
  establishment_id: string;
  name: string;
  cycle: CycleKey;
  niveau: string;
  series_id?: string | null;
  academic_year?: string;
  capacity?: number | null;
  created_at: string;
}

export interface Serie {
  id: string;
  establishment_id: string;
  code: string;
}

export interface Subject {
  id: string;
  establishment_id: string;
  name: string;
  code?: string;
  default_coefficient: number;
  created_at: string;
}

export interface Student {
  id: string;
  establishment_id: string;
  matricule: string;
  last_name: string;
  first_name: string;
  birth_date?: string | null;
  gender?: 'M' | 'F' | null;
  nationality?: string | null;
  guardian_name?: string;
  guardian_phone?: string;
  class_id?: string | null;
  status: 'active' | 'archived';
  created_at: string;
}

export interface GradeRecord {
  id: string;
  establishment_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  period: 'T1' | 'T2' | 'T3';
  year?: string | null;
  devoir1?: number | null;
  devoir2?: number | null;
  devoir3?: number | null;
  devoir_dept?: number | null;
  composition?: number | null;
}

export interface AIMessageAttachment {
  id?: string;
  name: string;
  size: number;
  type: 'image' | 'pdf' | 'audio';
  previewURL?: string;
  url?: string;
  data?: string;
  mimeType?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: AIMessageAttachment[];
  loading?: boolean;
  error?: boolean;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  title: string;
  mode: AIMode;
  createdAt: number;
  updatedAt: number;
  messages: AIMessage[];
}

export type AIMode = 'general' | 'lesson' | 'exam' | 'remedial' | 'bulletin';

export interface CountryInfo {
  name: string;
  republic: string;
  motto: string;
  phoneCode: string;
  flag: string;
  colors: [string, string, string];
}

export type ExamType = 'devoir' | 'devoir_dept' | 'composition' | 'interrogation';

export interface ExamEvent {
  id: string;
  establishment_id: string;
  class_id: string;
  subject_id: string;
  title: string;
  type: ExamType;
  period: 'T1' | 'T2' | 'T3';
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:mm
  duration_minutes?: number; // e.g. 120
  coefficient?: number;
  room?: string;
  status: 'planned' | 'completed' | 'cancelled';
  instructions?: string;
  created_at: string;
}
