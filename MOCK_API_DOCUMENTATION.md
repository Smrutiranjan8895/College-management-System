# College Management System

## Mock API Documentation (Presentation Ready)

Date: 08 Apr 2026  
Backend: AWS Lambda + API Gateway (Serverless)  
Authentication: AWS Cognito  
API Base URL: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev  
Cognito Endpoint URL: https://cognito-idp.ap-south-1.amazonaws.com/  
Cognito App Client ID: 3un6jatnpo8iga6vh2hvf4ko8e

---

## 1. Project Context

This project is a College Management System with:

- Student Dashboard
- Teacher Dashboard
- Attendance System
- Notices
- Results
- AWS Cognito Authentication

---

## 2. How to Run APIs via Terminal

### 2.1 Set common variables (PowerShell)

```powershell
$API_BASE = "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev"
$COGNITO_URL = "https://cognito-idp.ap-south-1.amazonaws.com/"
$CLIENT_ID = "3un6jatnpo8iga6vh2hvf4ko8e"
```

### 2.2 Authorization token usage

1. Login using Cognito Login API.
2. Copy IdToken from response.
3. Use token in protected API headers:

```http
Authorization: Bearer <ID_TOKEN>
```

### 2.3 Get token quickly (PowerShell)

```powershell
$LOGIN_BODY = '{"AuthFlow":"USER_PASSWORD_AUTH","ClientId":"3un6jatnpo8iga6vh2hvf4ko8e","AuthParameters":{"USERNAME":"demo.student@gcek.edu.in","PASSWORD":"Demo@1234"}}'
$LOGIN_RESPONSE = curl.exe -s -X POST "$COGNITO_URL" -H "Content-Type: application/x-amz-json-1.1" -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" -d $LOGIN_BODY
$TOKEN = ($LOGIN_RESPONSE | ConvertFrom-Json).AuthenticationResult.IdToken
$TOKEN
```

---

## 3. API Index

| Category | API | Method | Endpoint |
|---|---|---|---|
| Auth | Signup | POST | https://cognito-idp.ap-south-1.amazonaws.com/ |
| Auth | Login | POST | https://cognito-idp.ap-south-1.amazonaws.com/ |
| Auth | Verify Email | POST | https://cognito-idp.ap-south-1.amazonaws.com/ |
| Student | Get Student Profile | GET | /users/me |
| Student | Get Attendance | GET | /attendance/me |
| Student | Get Results | GET | /results/me |
| Teacher | Get Students List | GET | /students?branch=CS |
| Teacher | Mark Attendance | POST | /attendance |
| Teacher | Post Notice | POST | /notices |
| Notice | Create Notice | POST | /notices |
| Notice | Get All Notices | GET | /notices?branch=CS&limit=20 |

---

## 4. Auth APIs

### 4.1 Signup

**Endpoint URL**: https://cognito-idp.ap-south-1.amazonaws.com/  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Content-Type": "application/x-amz-json-1.1",
  "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp"
}
```

**Description**: Register a new user in Cognito.

**Request Body**:

```json
{
  "ClientId": "3un6jatnpo8iga6vh2hvf4ko8e",
  "Username": "demostudent_mh0x9a_1a2b3c",
  "Password": "Demo@1234",
  "UserAttributes": [
    { "Name": "email", "Value": "demo.student@gcek.edu.in" },
    { "Name": "name", "Value": "Riya Sharma" },
    { "Name": "phone_number", "Value": "+919876543210" },
    { "Name": "custom:role", "Value": "student" },
    { "Name": "custom:branch", "Value": "CS" }
  ]
}
```

**Response Body (Sample)**:

```json
{
  "UserConfirmed": false,
  "CodeDeliveryDetails": {
    "Destination": "d***@gcek.edu.in",
    "DeliveryMedium": "EMAIL",
    "AttributeName": "email"
  },
  "UserSub": "1f2e3d4c-aaaa-bbbb-cccc-1234567890ab"
}
```

**Terminal cURL**:

```bash
curl -X POST "https://cognito-idp.ap-south-1.amazonaws.com/" \
-H "Content-Type: application/x-amz-json-1.1" \
-H "X-Amz-Target: AWSCognitoIdentityProviderService.SignUp" \
-d '{"ClientId":"3un6jatnpo8iga6vh2hvf4ko8e","Username":"demostudent_mh0x9a_1a2b3c","Password":"Demo@1234","UserAttributes":[{"Name":"email","Value":"demo.student@gcek.edu.in"},{"Name":"name","Value":"Riya Sharma"},{"Name":"phone_number","Value":"+919876543210"},{"Name":"custom:role","Value":"student"},{"Name":"custom:branch","Value":"CS"}]}'
```

---

### 4.2 Login

**Endpoint URL**: https://cognito-idp.ap-south-1.amazonaws.com/  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Content-Type": "application/x-amz-json-1.1",
  "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth"
}
```

**Description**: Login and get JWT token for protected APIs.

**Request Body**:

```json
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "3un6jatnpo8iga6vh2hvf4ko8e",
  "AuthParameters": {
    "USERNAME": "demo.student@gcek.edu.in",
    "PASSWORD": "Demo@1234"
  }
}
```

**Response Body (Sample)**:

```json
{
  "AuthenticationResult": {
    "AccessToken": "eyJ...access...",
    "IdToken": "eyJ...id...",
    "RefreshToken": "eyJ...refresh...",
    "ExpiresIn": 3600,
    "TokenType": "Bearer"
  }
}
```

**Terminal cURL**:

```bash
curl -X POST "https://cognito-idp.ap-south-1.amazonaws.com/" \
-H "Content-Type: application/x-amz-json-1.1" \
-H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
-d '{"AuthFlow":"USER_PASSWORD_AUTH","ClientId":"3un6jatnpo8iga6vh2hvf4ko8e","AuthParameters":{"USERNAME":"demo.student@gcek.edu.in","PASSWORD":"Demo@1234"}}'
```

---

### 4.3 Verify Email

**Endpoint URL**: https://cognito-idp.ap-south-1.amazonaws.com/  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Content-Type": "application/x-amz-json-1.1",
  "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp"
}
```

**Description**: Verify email using OTP code.

**Request Body**:

```json
{
  "ClientId": "3un6jatnpo8iga6vh2hvf4ko8e",
  "Username": "demostudent_mh0x9a_1a2b3c",
  "ConfirmationCode": "123456"
}
```

**Response Body (Sample)**:

```json
{
  "$metadata": {
    "httpStatusCode": 200
  }
}
```

**Terminal cURL**:

```bash
curl -X POST "https://cognito-idp.ap-south-1.amazonaws.com/" \
-H "Content-Type: application/x-amz-json-1.1" \
-H "X-Amz-Target: AWSCognitoIdentityProviderService.ConfirmSignUp" \
-d '{"ClientId":"3un6jatnpo8iga6vh2hvf4ko8e","Username":"demostudent_mh0x9a_1a2b3c","ConfirmationCode":"123456"}'
```

---

## 5. Student APIs

### 5.1 Get Student Profile

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/users/me  
**HTTP Method**: GET  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>"
}
```

**Description**: Fetch logged-in user profile and role details.

**Request Body**:

```json
{}
```

**Response Body (Sample)**:

```json
{
  "data": {
    "userId": "1f2e3d4c-aaaa-bbbb-cccc-1234567890ab",
    "username": "demostudent_mh0x9a_1a2b3c",
    "email": "demo.student@gcek.edu.in",
    "name": "Riya Sharma",
    "role": "student",
    "roleAssigned": true,
    "branch": "CS",
    "groups": ["student"]
  }
}
```

**Terminal cURL**:

```bash
curl -X GET "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/users/me" \
-H "Authorization: Bearer <ID_TOKEN>"
```

---

### 5.2 Get Attendance

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/attendance/me  
**HTTP Method**: GET  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>"
}
```

**Description**: Fetch logged-in student attendance and stats.

**Request Body**:

```json
{}
```

**Response Body (Sample)**:

```json
{
  "attendance": [
    {
      "studentId": "STU-CS-001",
      "dateSubject": "2026-04-01#Data Structures",
      "status": "present",
      "subject": "Data Structures",
      "date": "2026-04-01",
      "branch": "CS"
    }
  ],
  "stats": {
    "total": 20,
    "present": 17,
    "absent": 3,
    "percentage": 85
  },
  "studentId": "STU-CS-001"
}
```

**Terminal cURL**:

```bash
curl -X GET "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/attendance/me" \
-H "Authorization: Bearer <ID_TOKEN>"
```

---

### 5.3 Get Results

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/results/me  
**HTTP Method**: GET  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>"
}
```

**Description**: Fetch logged-in student subject-wise marks and GPA summary.

**Request Body**:

```json
{}
```

**Response Body (Sample)**:

```json
{
  "results": [
    {
      "studentId": "STU-CS-001",
      "semesterSubject": "SEM5#Algorithms",
      "semester": "SEM5",
      "subject": "Algorithms",
      "marks": 84,
      "maxMarks": 100,
      "percentage": 84,
      "grade": "A+",
      "gradePoints": 9
    }
  ],
  "semesterGPAs": {
    "SEM5": 8.67
  },
  "cgpa": 8.67
}
```

**Terminal cURL**:

```bash
curl -X GET "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/results/me" \
-H "Authorization: Bearer <ID_TOKEN>"
```

---

## 6. Teacher APIs

### 6.1 Get Students List

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/students?branch=CS  
**HTTP Method**: GET  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>"
}
```

**Description**: Fetch list of students by branch.

**Request Body**:

```json
{}
```

**Response Body (Sample)**:

```json
{
  "students": [
    {
      "studentId": "STU-CS-001",
      "rollNumber": "CSE23001",
      "name": "Aditi Nayak",
      "email": "aditi.nayak@gcek.edu.in",
      "branch": "CS",
      "semester": 5,
      "year": 3
    }
  ]
}
```

**Terminal cURL**:

```bash
curl -X GET "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/students?branch=CS" \
-H "Authorization: Bearer <ID_TOKEN>"
```

---

### 6.2 Mark Attendance

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/attendance  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>",
  "Content-Type": "application/json"
}
```

**Description**: Mark attendance for a student.

**Request Body**:

```json
{
  "studentId": "STU-CS-001",
  "date": "2026-04-08",
  "subject": "Data Structures",
  "status": "present",
  "branch": "CS"
}
```

**Response Body (Sample)**:

```json
{
  "attendance": {
    "studentId": "STU-CS-001",
    "dateSubject": "2026-04-08#Data Structures",
    "status": "present",
    "subject": "Data Structures",
    "date": "2026-04-08",
    "branch": "CS"
  },
  "message": "Attendance marked successfully"
}
```

**Terminal cURL**:

```bash
curl -X POST "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/attendance" \
-H "Authorization: Bearer <ID_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"studentId":"STU-CS-001","date":"2026-04-08","subject":"Data Structures","status":"present","branch":"CS"}'
```

---

### 6.3 Post Notice

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>",
  "Content-Type": "application/json"
}
```

**Description**: Create and post notice for branch or all students.

**Request Body**:

```json
{
  "title": "Mid-Sem Exam Preparation Session",
  "content": "Special revision class on Friday 3 PM in Seminar Hall.",
  "branch": "CS",
  "priority": "HIGH"
}
```

**Response Body (Sample)**:

```json
{
  "notice": {
    "branch": "CS",
    "createdAt": "2026-04-08T11:30:00.000Z",
    "noticeId": "CS#2026-04-08T11:30:00.000Z",
    "title": "Mid-Sem Exam Preparation Session",
    "content": "Special revision class on Friday 3 PM in Seminar Hall.",
    "priority": "HIGH"
  },
  "message": "Notice posted successfully"
}
```

**Terminal cURL**:

```bash
curl -X POST "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices" \
-H "Authorization: Bearer <ID_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"title":"Mid-Sem Exam Preparation Session","content":"Special revision class on Friday 3 PM in Seminar Hall.","branch":"CS","priority":"HIGH"}'
```

---

## 7. Notice APIs

### 7.1 Create Notice

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices  
**HTTP Method**: POST  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>",
  "Content-Type": "application/json"
}
```

**Description**: Create a new notice.

**Request Body**:

```json
{
  "title": "Fee Payment Deadline",
  "content": "Semester fee must be paid before 30 April 2026.",
  "branch": "ALL",
  "priority": "HIGH"
}
```

**Response Body (Sample)**:

```json
{
  "message": "Notice posted successfully",
  "data": {
    "branch": "ALL",
    "createdAt": "2026-04-08T12:00:00.000Z",
    "noticeId": "ALL#2026-04-08T12:00:00.000Z",
    "title": "Fee Payment Deadline",
    "content": "Semester fee must be paid before 30 April 2026.",
    "priority": "HIGH"
  }
}
```

**Terminal cURL**:

```bash
curl -X POST "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices" \
-H "Authorization: Bearer <ID_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"title":"Fee Payment Deadline","content":"Semester fee must be paid before 30 April 2026.","branch":"ALL","priority":"HIGH"}'
```

---

### 7.2 Get All Notices

**Endpoint URL**: https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices?branch=CS&limit=20  
**HTTP Method**: GET  
**Headers**:

```json
{
  "Authorization": "Bearer <ID_TOKEN>"
}
```

**Description**: Fetch branch notices and global notices.

**Request Body**:

```json
{}
```

**Response Body (Sample)**:

```json
{
  "notices": [
    {
      "branch": "ALL",
      "createdAt": "2026-04-07T07:45:00.000Z",
      "title": "End-Sem Form Fill-up Announcement",
      "content": "Online form fill-up for end-sem examinations starts from 18 Apr 2026.",
      "priority": "HIGH"
    },
    {
      "branch": "CS",
      "createdAt": "2026-04-06T11:45:00.000Z",
      "title": "CSE Lab Evaluation Circular",
      "content": "Internal lab evaluation for CSE Sem 5 will be held on 12 Apr 2026.",
      "priority": "MEDIUM"
    }
  ]
}
```

**Terminal cURL**:

```bash
curl -X GET "https://58i5uyfh3l.execute-api.ap-south-1.amazonaws.com/dev/notices?branch=CS&limit=20" \
-H "Authorization: Bearer <ID_TOKEN>"
```

---

## 8. Dummy Data

### 8.1 Students (8 records)

```json
[
  { "studentId": "STU-CS-001", "name": "Aditi Nayak", "rollNumber": "CSE23001", "branch": "CS", "semester": 5, "email": "aditi.nayak@gcek.edu.in" },
  { "studentId": "STU-CS-002", "name": "Rahul Behera", "rollNumber": "CSE23002", "branch": "CS", "semester": 5, "email": "rahul.behera@gcek.edu.in" },
  { "studentId": "STU-EC-001", "name": "Sneha Patel", "rollNumber": "ECE23001", "branch": "EC", "semester": 5, "email": "sneha.patel@gcek.edu.in" },
  { "studentId": "STU-EC-002", "name": "Ankit Sharma", "rollNumber": "ECE23002", "branch": "EC", "semester": 3, "email": "ankit.sharma@gcek.edu.in" },
  { "studentId": "STU-ME-001", "name": "Pritam Das", "rollNumber": "ME23001", "branch": "ME", "semester": 5, "email": "pritam.das@gcek.edu.in" },
  { "studentId": "STU-CE-001", "name": "Karan Mohanty", "rollNumber": "CE23001", "branch": "CE", "semester": 5, "email": "karan.mohanty@gcek.edu.in" },
  { "studentId": "STU-EE-001", "name": "Nikhil Kumar", "rollNumber": "EE23001", "branch": "EE", "semester": 5, "email": "nikhil.kumar@gcek.edu.in" },
  { "studentId": "STU-EE-002", "name": "Priya Rani", "rollNumber": "EE23002", "branch": "EE", "semester": 3, "email": "priya.rani@gcek.edu.in" }
]
```

### 8.2 Attendance (sample)

```json
[
  { "studentId": "STU-CS-001", "date": "2026-04-01", "subject": "Data Structures", "status": "present", "branch": "CS" },
  { "studentId": "STU-CS-001", "date": "2026-04-02", "subject": "Algorithms", "status": "present", "branch": "CS" },
  { "studentId": "STU-CS-001", "date": "2026-04-03", "subject": "DBMS", "status": "absent", "branch": "CS" },
  { "studentId": "STU-CS-002", "date": "2026-04-01", "subject": "Data Structures", "status": "present", "branch": "CS" },
  { "studentId": "STU-CS-002", "date": "2026-04-02", "subject": "Algorithms", "status": "absent", "branch": "CS" },
  { "studentId": "STU-EC-001", "date": "2026-04-01", "subject": "DSP", "status": "present", "branch": "EC" },
  { "studentId": "STU-ME-001", "date": "2026-04-01", "subject": "Thermodynamics-II", "status": "present", "branch": "ME" },
  { "studentId": "STU-CE-001", "date": "2026-04-01", "subject": "Structural Analysis", "status": "present", "branch": "CE" },
  { "studentId": "STU-EE-001", "date": "2026-04-01", "subject": "Power Systems", "status": "present", "branch": "EE" },
  { "studentId": "STU-EE-002", "date": "2026-04-01", "subject": "Electrical Machines", "status": "absent", "branch": "EE" }
]
```

### 8.3 Results (subject-wise + SGPA)

```json
{
  "results": [
    { "studentId": "STU-CS-001", "semester": "SEM5", "subject": "Data Structures", "marks": 86, "maxMarks": 100, "grade": "A+", "gradePoints": 9 },
    { "studentId": "STU-CS-001", "semester": "SEM5", "subject": "Algorithms", "marks": 84, "maxMarks": 100, "grade": "A+", "gradePoints": 9 },
    { "studentId": "STU-CS-001", "semester": "SEM5", "subject": "DBMS", "marks": 91, "maxMarks": 100, "grade": "O", "gradePoints": 10 },
    { "studentId": "STU-CS-002", "semester": "SEM5", "subject": "Data Structures", "marks": 74, "maxMarks": 100, "grade": "A", "gradePoints": 8 },
    { "studentId": "STU-CS-002", "semester": "SEM5", "subject": "Algorithms", "marks": 82, "maxMarks": 100, "grade": "A+", "gradePoints": 9 },
    { "studentId": "STU-CS-002", "semester": "SEM5", "subject": "DBMS", "marks": 69, "maxMarks": 100, "grade": "B+", "gradePoints": 7 }
  ],
  "sgpaSummary": [
    { "studentId": "STU-CS-001", "semester": "SEM5", "sgpa": 9.33 },
    { "studentId": "STU-CS-002", "semester": "SEM5", "sgpa": 8.00 }
  ]
}
```

### 8.4 Notices (exam, holiday, fees)

```json
[
  {
    "title": "Mid-Semester Examination Schedule Released",
    "content": "Mid-semester exams will run from 15 Apr 2026 to 22 Apr 2026.",
    "branch": "ALL",
    "priority": "HIGH"
  },
  {
    "title": "Summer Break Notification",
    "content": "College will remain closed from 20 May 2026 to 10 Jun 2026.",
    "branch": "ALL",
    "priority": "MEDIUM"
  },
  {
    "title": "Semester Fee Payment Deadline",
    "content": "Fee payment deadline is 30 Apr 2026. Late fee applies afterward.",
    "branch": "ALL",
    "priority": "HIGH"
  },
  {
    "title": "CSE Lab Evaluation Circular",
    "content": "Lab evaluation for Sem 5 on 12 Apr 2026.",
    "branch": "CS",
    "priority": "MEDIUM"
  },
  {
    "title": "Placement Training Orientation",
    "content": "Pre-placement training starts Monday 10:00 AM.",
    "branch": "ALL",
    "priority": "LOW"
  }
]
```

---

## 9. Demo Sequence (for Presentation)

1. Signup user in Cognito.
2. Verify email using OTP.
3. Login and capture IdToken.
4. Run student profile API.
5. Run attendance and results APIs.
6. Run teacher APIs (students list, mark attendance, post notice).
7. Run notices API and show latest notices.

---

## 10. Common Error Samples

### Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Forbidden

```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### Validation Error

```json
{
  "error": "Missing required fields: studentId, date, subject, status"
}
```
