import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from './dynamo.js';

const DUMMY_STUDENTS = [
  {
    studentId: 'STU-CS-001',
    rollNumber: 'CSE23001',
    name: 'Aditi Nayak',
    email: 'aditi.nayak@gcek.edu.in',
    branch: 'CS',
    semester: 5,
    year: 3,
    department: 'Computer Science',
    phone: '+919876540001',
  },
  {
    studentId: 'STU-CS-002',
    rollNumber: 'CSE23002',
    name: 'Rahul Behera',
    email: 'rahul.behera@gcek.edu.in',
    branch: 'CS',
    semester: 5,
    year: 3,
    department: 'Computer Science',
    phone: '+919876540002',
  },
  {
    studentId: 'STU-EC-001',
    rollNumber: 'ECE23001',
    name: 'Sneha Patel',
    email: 'sneha.patel@gcek.edu.in',
    branch: 'EC',
    semester: 5,
    year: 3,
    department: 'Electronics and Communication',
    phone: '+919876540003',
  },
  {
    studentId: 'STU-EC-002',
    rollNumber: 'ECE23002',
    name: 'Ankit Sharma',
    email: 'ankit.sharma@gcek.edu.in',
    branch: 'EC',
    semester: 3,
    year: 2,
    department: 'Electronics and Communication',
    phone: '+919876540004',
  },
  {
    studentId: 'STU-ME-001',
    rollNumber: 'ME23001',
    name: 'Pritam Das',
    email: 'pritam.das@gcek.edu.in',
    branch: 'ME',
    semester: 5,
    year: 3,
    department: 'Mechanical Engineering',
    phone: '+919876540005',
  },
  {
    studentId: 'STU-ME-002',
    rollNumber: 'ME23002',
    name: 'Neha Sahu',
    email: 'neha.sahu@gcek.edu.in',
    branch: 'ME',
    semester: 3,
    year: 2,
    department: 'Mechanical Engineering',
    phone: '+919876540006',
  },
  {
    studentId: 'STU-CE-001',
    rollNumber: 'CE23001',
    name: 'Karan Mohanty',
    email: 'karan.mohanty@gcek.edu.in',
    branch: 'CE',
    semester: 5,
    year: 3,
    department: 'Civil Engineering',
    phone: '+919876540007',
  },
  {
    studentId: 'STU-CE-002',
    rollNumber: 'CE23002',
    name: 'Ritika Jain',
    email: 'ritika.jain@gcek.edu.in',
    branch: 'CE',
    semester: 3,
    year: 2,
    department: 'Civil Engineering',
    phone: '+919876540008',
  },
  {
    studentId: 'STU-EE-001',
    rollNumber: 'EE23001',
    name: 'Nikhil Kumar',
    email: 'nikhil.kumar@gcek.edu.in',
    branch: 'EE',
    semester: 5,
    year: 3,
    department: 'Electrical Engineering',
    phone: '+919876540009',
  },
  {
    studentId: 'STU-EE-002',
    rollNumber: 'EE23002',
    name: 'Priya Rani',
    email: 'priya.rani@gcek.edu.in',
    branch: 'EE',
    semester: 3,
    year: 2,
    department: 'Electrical Engineering',
    phone: '+919876540010',
  },
];

const DUMMY_NOTICES = [
  {
    branch: 'ALL',
    createdAt: '2026-04-02T09:00:00.000Z',
    title: 'Mid-Semester Examination Schedule Released',
    content:
      'Mid-semester examinations for Sem 2, 4, and 6 will run from 15 Apr 2026 to 22 Apr 2026. Department-wise timetables are available on the portal.',
    priority: 'HIGH',
    postedBy: 'Academic Office - Admin',
  },
  {
    branch: 'ALL',
    createdAt: '2026-04-04T10:30:00.000Z',
    title: 'Summer Break Notification',
    content:
      'The institute will remain closed for summer break from 20 May 2026 to 10 Jun 2026. Hostel students should complete out-pass formalities by 18 May.',
    priority: 'MEDIUM',
    postedBy: 'Principal Office - Admin',
  },
  {
    branch: 'ALL',
    createdAt: '2026-04-05T08:15:00.000Z',
    title: 'Tuition Fee Payment Deadline',
    content:
      'Semester fee payment deadline is 30 Apr 2026. Late payment after this date will attract a fine as per institute policy.',
    priority: 'HIGH',
    postedBy: 'Accounts Section - Admin',
  },
  {
    branch: 'CS',
    createdAt: '2026-04-06T11:45:00.000Z',
    title: 'CSE Lab Evaluation Circular',
    content:
      'Internal lab evaluation for CSE Sem 5 will be held on 12 Apr 2026 in Lab-2 and Lab-3. Bring updated lab records.',
    priority: 'MEDIUM',
    postedBy: 'HOD CSE - Teacher',
  },
  {
    branch: 'ALL',
    createdAt: '2026-04-07T07:45:00.000Z',
    title: 'End-Sem Form Fill-up Announcement',
    content:
      'Online form fill-up for end-sem examinations starts from 18 Apr 2026. Students must verify subject registration before submission.',
    priority: 'HIGH',
    postedBy: 'Exam Cell - Admin',
  },
];

const DUMMY_RESULTS = [
  { studentId: 'STU-CS-001', branch: 'CS', semester: 'SEM5', subject: 'Data Structures', marks: 86, maxMarks: 100 },
  { studentId: 'STU-CS-001', branch: 'CS', semester: 'SEM5', subject: 'Algorithms', marks: 79, maxMarks: 100 },
  { studentId: 'STU-CS-001', branch: 'CS', semester: 'SEM5', subject: 'Database Systems', marks: 91, maxMarks: 100 },

  { studentId: 'STU-CS-002', branch: 'CS', semester: 'SEM5', subject: 'Data Structures', marks: 74, maxMarks: 100 },
  { studentId: 'STU-CS-002', branch: 'CS', semester: 'SEM5', subject: 'Algorithms', marks: 82, maxMarks: 100 },
  { studentId: 'STU-CS-002', branch: 'CS', semester: 'SEM5', subject: 'Database Systems', marks: 69, maxMarks: 100 },

  { studentId: 'STU-EC-001', branch: 'EC', semester: 'SEM5', subject: 'Digital Signal Processing', marks: 88, maxMarks: 100 },
  { studentId: 'STU-EC-001', branch: 'EC', semester: 'SEM5', subject: 'Communication Systems', marks: 77, maxMarks: 100 },
  { studentId: 'STU-EC-001', branch: 'EC', semester: 'SEM5', subject: 'Microcontrollers', marks: 84, maxMarks: 100 },

  { studentId: 'STU-ME-001', branch: 'ME', semester: 'SEM5', subject: 'Thermodynamics-II', marks: 72, maxMarks: 100 },
  { studentId: 'STU-ME-001', branch: 'ME', semester: 'SEM5', subject: 'Manufacturing Processes', marks: 81, maxMarks: 100 },
  { studentId: 'STU-ME-001', branch: 'ME', semester: 'SEM5', subject: 'Machine Design', marks: 76, maxMarks: 100 },

  { studentId: 'STU-CE-001', branch: 'CE', semester: 'SEM5', subject: 'Structural Analysis', marks: 83, maxMarks: 100 },
  { studentId: 'STU-CE-001', branch: 'CE', semester: 'SEM5', subject: 'Geotechnical Engineering', marks: 68, maxMarks: 100 },
  { studentId: 'STU-CE-001', branch: 'CE', semester: 'SEM5', subject: 'Transportation Engineering', marks: 90, maxMarks: 100 },
];

const DUMMY_ATTENDANCE = [
  { studentId: 'STU-CS-001', branch: 'CS', date: '2026-04-01', subject: 'Data Structures', status: 'present' },
  { studentId: 'STU-CS-001', branch: 'CS', date: '2026-04-02', subject: 'Algorithms', status: 'present' },
  { studentId: 'STU-CS-001', branch: 'CS', date: '2026-04-03', subject: 'Database Systems', status: 'absent' },
  { studentId: 'STU-CS-001', branch: 'CS', date: '2026-04-04', subject: 'Data Structures', status: 'present' },

  { studentId: 'STU-CS-002', branch: 'CS', date: '2026-04-01', subject: 'Data Structures', status: 'present' },
  { studentId: 'STU-CS-002', branch: 'CS', date: '2026-04-02', subject: 'Algorithms', status: 'absent' },
  { studentId: 'STU-CS-002', branch: 'CS', date: '2026-04-03', subject: 'Database Systems', status: 'present' },
  { studentId: 'STU-CS-002', branch: 'CS', date: '2026-04-04', subject: 'Data Structures', status: 'present' },

  { studentId: 'STU-EC-001', branch: 'EC', date: '2026-04-01', subject: 'Digital Signal Processing', status: 'present' },
  { studentId: 'STU-EC-001', branch: 'EC', date: '2026-04-02', subject: 'Communication Systems', status: 'present' },
  { studentId: 'STU-EC-001', branch: 'EC', date: '2026-04-03', subject: 'Microcontrollers', status: 'present' },
  { studentId: 'STU-EC-001', branch: 'EC', date: '2026-04-04', subject: 'Digital Signal Processing', status: 'absent' },

  { studentId: 'STU-ME-001', branch: 'ME', date: '2026-04-01', subject: 'Thermodynamics-II', status: 'present' },
  { studentId: 'STU-ME-001', branch: 'ME', date: '2026-04-02', subject: 'Machine Design', status: 'present' },
  { studentId: 'STU-ME-001', branch: 'ME', date: '2026-04-03', subject: 'Manufacturing Processes', status: 'absent' },
  { studentId: 'STU-ME-001', branch: 'ME', date: '2026-04-04', subject: 'Thermodynamics-II', status: 'present' },

  { studentId: 'STU-CE-001', branch: 'CE', date: '2026-04-01', subject: 'Structural Analysis', status: 'present' },
  { studentId: 'STU-CE-001', branch: 'CE', date: '2026-04-02', subject: 'Geotechnical Engineering', status: 'present' },
  { studentId: 'STU-CE-001', branch: 'CE', date: '2026-04-03', subject: 'Transportation Engineering', status: 'present' },
  { studentId: 'STU-CE-001', branch: 'CE', date: '2026-04-04', subject: 'Structural Analysis', status: 'absent' },
];

let seedPromise = null;
let seedChecked = false;

function getGradeInfo(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return { grade: 'O', gradePoints: 10, percentage: parseFloat(percentage.toFixed(2)) };
  if (percentage >= 80) return { grade: 'A+', gradePoints: 9, percentage: parseFloat(percentage.toFixed(2)) };
  if (percentage >= 70) return { grade: 'A', gradePoints: 8, percentage: parseFloat(percentage.toFixed(2)) };
  if (percentage >= 60) return { grade: 'B+', gradePoints: 7, percentage: parseFloat(percentage.toFixed(2)) };
  if (percentage >= 50) return { grade: 'B', gradePoints: 6, percentage: parseFloat(percentage.toFixed(2)) };
  if (percentage >= 40) return { grade: 'C', gradePoints: 5, percentage: parseFloat(percentage.toFixed(2)) };
  return { grade: 'F', gradePoints: 0, percentage: parseFloat(percentage.toFixed(2)) };
}

async function putIfMissing(tableName, item, keyFields) {
  const condition = keyFields.map((field) => `attribute_not_exists(${field})`).join(' AND ');

  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: condition,
    }));
    return 1;
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return 0;
    }
    throw error;
  }
}

async function hasAnyStudents() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.STUDENTS,
    Select: 'COUNT',
    Limit: 1,
  }));

  return (result.Count || 0) > 0;
}

async function seedDummyAcademicDataInternal(seedBy = 'system-seed') {
  const now = new Date().toISOString();
  const counters = {
    students: 0,
    notices: 0,
    results: 0,
    attendance: 0,
  };

  for (const student of DUMMY_STUDENTS) {
    counters.students += await putIfMissing(
      TABLES.STUDENTS,
      {
        ...student,
        createdAt: now,
        createdBy: seedBy,
        updatedAt: now,
      },
      ['studentId', 'branch']
    );
  }

  for (const notice of DUMMY_NOTICES) {
    counters.notices += await putIfMissing(
      TABLES.NOTICES,
      {
        ...notice,
        updatedAt: notice.createdAt,
      },
      ['branch', 'createdAt']
    );
  }

  for (const result of DUMMY_RESULTS) {
    const { grade, gradePoints, percentage } = getGradeInfo(result.marks, result.maxMarks);
    const semesterSubject = `${result.semester}#${result.subject}`;

    counters.results += await putIfMissing(
      TABLES.RESULTS,
      {
        ...result,
        semesterSubject,
        grade,
        gradePoints,
        percentage,
        createdAt: now,
        updatedAt: now,
        enteredBy: seedBy,
      },
      ['studentId', 'semesterSubject']
    );
  }

  for (const attendance of DUMMY_ATTENDANCE) {
    const dateSubject = `${attendance.date}#${attendance.subject}`;

    counters.attendance += await putIfMissing(
      TABLES.ATTENDANCE,
      {
        ...attendance,
        dateSubject,
        markedBy: seedBy,
        markedAt: now,
      },
      ['studentId', 'dateSubject']
    );
  }

  return counters;
}

export async function ensureDummyAcademicDataSeeded(seedBy = 'system-seed') {
  if ((process.env.AUTO_SEED_DUMMY || 'true').toLowerCase() === 'false') {
    return { seeded: false, reason: 'auto-seed-disabled' };
  }

  if (seedChecked) {
    return { seeded: false, reason: 'already-checked' };
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      const alreadyHasStudents = await hasAnyStudents();
      if (alreadyHasStudents) {
        seedChecked = true;
        return { seeded: false, reason: 'existing-data' };
      }

      const counters = await seedDummyAcademicDataInternal(seedBy);
      seedChecked = true;
      return { seeded: true, counters };
    })();
  }

  return seedPromise;
}

export async function forceSeedDummyAcademicData(seedBy = 'manual-seed') {
  const counters = await seedDummyAcademicDataInternal(seedBy);
  seedChecked = true;
  return { seeded: true, counters };
}

export const DUMMY_DATASET = {
  students: DUMMY_STUDENTS,
  notices: DUMMY_NOTICES,
  results: DUMMY_RESULTS,
  attendance: DUMMY_ATTENDANCE,
};
