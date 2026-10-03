import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { StudentUser, TeacherUser, AdminUser } from '../types';

/**
 * Safely parses any date/timestamp string format (including Indonesian locale strings like "14/9/2026, 10.15.24")
 * into a valid ISO 8601 string acceptable by PostgreSQL TIMESTAMPTZ.
 */
export const parseToIsoTimestamp = (input?: string): string => {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return new Date().toISOString();
  }
  const str = input.trim();

  // Try standard JS Date parsing first
  const standardDate = new Date(str);
  if (!isNaN(standardDate.getTime())) {
    return standardDate.toISOString();
  }

  // Handle Indonesian / localized strings e.g. "14/9/2026, 10.15.24" or "14/09/2026 10:15:24"
  const match = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})(?:[,\s]+(\d{1,2})[\.\:](\d{1,2})(?:[\.\:](\d{1,2}))?)?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const sec = match[6] ? parseInt(match[6], 10) : 0;

    const parsedUtc = new Date(Date.UTC(year, month, day, hour, min, sec));
    if (!isNaN(parsedUtc.getTime())) {
      return parsedUtc.toISOString();
    }
  }

  return new Date().toISOString();
};

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export interface RestoredMasterUsers {
  students: StudentUser[];
  teachers: TeacherUser[];
  admins: AdminUser[];
}

/**
 * Generates SQL statements to create the required master user tables in Supabase SQL Editor
 */
export const generateSupabaseSQLSchema = (): string => {
  return `-- =========================================================
-- SKRIP DATABASE SUPABASE UNTUK BACKUP MASTER DATA USER CBT
-- Salin dan jalankan skrip ini di SQL Editor Dashboard Supabase
-- =========================================================

-- 1. Tabel Master Data Siswa
CREATE TABLE IF NOT EXISTS master_students (
  id TEXT PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  kode_guru TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Master Data Guru
CREATE TABLE IF NOT EXISTS master_teachers (
  id TEXT PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kode_guru TEXT UNIQUE NOT NULL,
  username TEXT,
  password TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Master Data Admin
CREATE TABLE IF NOT EXISTS master_admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) & Izinkan Akses Baca/Tulis
ALTER TABLE master_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_admins ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Anon Key Read/Write)
DROP POLICY IF EXISTS "Allow anon read write on master_students" ON master_students;
CREATE POLICY "Allow anon read write on master_students" ON master_students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read write on master_teachers" ON master_teachers;
CREATE POLICY "Allow anon read write on master_teachers" ON master_teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read write on master_admins" ON master_admins;
CREATE POLICY "Allow anon read write on master_admins" ON master_admins FOR ALL USING (true) WITH CHECK (true);
`;
};

/**
 * Backup all students to Supabase 'master_students'
 */
export const backupStudentsToSupabase = async (
  students: StudentUser[]
): Promise<SupabaseSyncResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Harap isi URL & Anon Key terlebih dahulu.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Gagal terhubung ke Supabase Client.' };
  }

  try {
    const payload = students.map((s) => ({
      id: s.id || `STU-${s.nis}`,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      is_active: s.isActive !== false,
      kode_guru: s.kodeGuru || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('master_students')
      .upsert(payload, { onConflict: 'nis' });

    if (error) {
      console.error('Supabase backup error (students):', error);
      return { success: false, message: `Error Supabase: ${error.message}`, error: error.message };
    }

    return {
      success: true,
      message: `Berhasil mencadangkan ${students.length} data siswa ke Supabase Cloud!`,
      count: students.length,
    };
  } catch (err: any) {
    return { success: false, message: `Terjadi kesalahan: ${err.message || err}` };
  }
};

/**
 * Backup all teachers to Supabase 'master_teachers'
 */
export const backupTeachersToSupabase = async (
  teachers: TeacherUser[]
): Promise<SupabaseSyncResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Harap isi URL & Anon Key terlebih dahulu.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Gagal terhubung ke Supabase Client.' };
  }

  try {
    const payload = teachers.map((t) => ({
      id: t.id || `TCH-${t.kodeGuru || t.nip}`,
      nip: t.nip,
      nama: t.nama,
      mapel: t.mapel,
      kode_guru: t.kodeGuru || t.nip,
      username: t.username || t.kodeGuru || '',
      password: t.password || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('master_teachers')
      .upsert(payload, { onConflict: 'nip' });

    if (error) {
      console.error('Supabase backup error (teachers):', error);
      return { success: false, message: `Error Supabase: ${error.message}`, error: error.message };
    }

    return {
      success: true,
      message: `Berhasil mencadangkan ${teachers.length} data guru ke Supabase Cloud!`,
      count: teachers.length,
    };
  } catch (err: any) {
    return { success: false, message: `Terjadi kesalahan: ${err.message || err}` };
  }
};

/**
 * Backup all admins to Supabase 'master_admins'
 */
export const backupAdminsToSupabase = async (
  admins: AdminUser[]
): Promise<SupabaseSyncResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Gagal terhubung ke Supabase Client.' };
  }

  try {
    const payload = admins.map((a) => ({
      id: a.id || `ADM-${a.username}`,
      username: a.username,
      nama: a.nama,
      password: a.password || '',
      role: a.role || 'admin',
      created_at: parseToIsoTimestamp(a.createdAt),
    }));

    const { error } = await client
      .from('master_admins')
      .upsert(payload, { onConflict: 'username' });

    if (error) {
      console.error('Supabase backup error (admins):', error);
      return { success: false, message: `Error Supabase: ${error.message}`, error: error.message };
    }

    return {
      success: true,
      message: `Berhasil mencadangkan ${admins.length} data admin ke Supabase Cloud!`,
      count: admins.length,
    };
  } catch (err: any) {
    return { success: false, message: `Terjadi kesalahan: ${err.message || err}` };
  }
};

/**
 * Backup entire master data user (Siswa, Guru, Admin) to Supabase
 */
export const backupAllUsersToSupabase = async ({
  students,
  teachers = [],
  admins = [],
}: {
  students: StudentUser[];
  teachers?: TeacherUser[];
  admins?: AdminUser[];
}): Promise<SupabaseSyncResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Masukkan URL & Anon Key pada menu Setting Supabase.',
    };
  }

  const resStudents = await backupStudentsToSupabase(students);
  if (!resStudents.success) return resStudents;

  if (teachers.length > 0) {
    const resTeachers = await backupTeachersToSupabase(teachers);
    if (!resTeachers.success) return resTeachers;
  }

  if (admins.length > 0) {
    const resAdmins = await backupAdminsToSupabase(admins);
    if (!resAdmins.success) return resAdmins;
  }

  return {
    success: true,
    message: `Pencadangan Berhasil! ${students.length} Siswa, ${teachers.length} Guru, dan ${admins.length} Admin tersimpan di Supabase Cloud.`,
  };
};

/**
 * Restore / Sync Master Data User from Supabase Cloud to Local State
 */
export const restoreUsersFromSupabase = async (): Promise<{
  success: boolean;
  message: string;
  data?: RestoredMasterUsers;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Gagal terhubung ke Supabase Client.' };
  }

  try {
    // Fetch Students
    const { data: dbStudents, error: errStu } = await client
      .from('master_students')
      .select('*')
      .order('kelas', { ascending: true });

    if (errStu) {
      return { success: false, message: `Gagal memuat siswa: ${errStu.message}` };
    }

    // Fetch Teachers
    const { data: dbTeachers, error: errTch } = await client
      .from('master_teachers')
      .select('*')
      .order('nama', { ascending: true });

    if (errTch) {
      return { success: false, message: `Gagal memuat guru: ${errTch.message}` };
    }

    // Fetch Admins
    const { data: dbAdmins, error: errAdm } = await client
      .from('master_admins')
      .select('*')
      .order('username', { ascending: true });

    if (errAdm) {
      return { success: false, message: `Gagal memuat admin: ${errAdm.message}` };
    }

    const students: StudentUser[] = (dbStudents || []).map((s: any) => ({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      isActive: s.is_active !== false,
      kodeGuru: s.kode_guru || '',
    }));

    const teachers: TeacherUser[] = (dbTeachers || []).map((t: any) => ({
      id: t.id,
      nip: t.nip,
      nama: t.nama,
      mapel: t.mapel,
      kodeGuru: t.kode_guru,
      username: t.username,
      password: t.password,
    }));

    const admins: AdminUser[] = (dbAdmins || []).map((a: any) => ({
      id: a.id,
      username: a.username,
      nama: a.nama,
      password: a.password,
      role: a.role,
      createdAt: a.created_at,
    }));

    return {
      success: true,
      message: `Berhasil memuat data dari Supabase: ${students.length} Siswa, ${teachers.length} Guru, ${admins.length} Admin.`,
      data: { students, teachers, admins },
    };
  } catch (err: any) {
    return { success: false, message: `Error Sinkronisasi: ${err.message || err}` };
  }
};
