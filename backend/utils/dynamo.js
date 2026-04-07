// DynamoDB DocumentClient setup for GCEK Central
// Region: ap-south-1 (Mumbai)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION || 'ap-south-1'
});

// Document client with proper marshalling options
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
});

// Table names - use environment variables in production
export const TABLES = {
  USERS: process.env.USERS_TABLE || 'Users',
  STUDENTS: process.env.STUDENTS_TABLE || process.env.STUDENT_TABLE || 'Student',
  ATTENDANCE: process.env.ATTENDANCE_TABLE || 'Attendance',
  RESULTS: process.env.RESULTS_TABLE || 'Results',
  NOTICES: process.env.NOTICES_TABLE || 'Notices'
};
