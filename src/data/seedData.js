const mongoose = require("mongoose");

// --- Pre-defined IDs for consistency ---
const ROLES = {
  STUDENT: new mongoose.Types.ObjectId("64b0f1a2c9e77b1111111111"),
  AGENT: new mongoose.Types.ObjectId("64b0f1a2c9e77b2222222222"),
  ADMIN: new mongoose.Types.ObjectId("64b0f1a2c9e77b3333333333"),
};

const USERS = {
  ADMIN: new mongoose.Types.ObjectId("64b0f1a2c9e77b4444444444"),
  AGENT: new mongoose.Types.ObjectId("64b0f1a2c9e77b5555555555"),
  STUDENT: new mongoose.Types.ObjectId("64b0f1a2c9e77b6666666666"),
};

const UNIVERSITIES = {
  MIT: new mongoose.Types.ObjectId("64b0f1a2c9e77b7777777777"),
};

const PROGRAMS = {
  CS_PHD: new mongoose.Types.ObjectId("64b0f1a2c9e77b8888888888"),
};

// --- Data Arrays ---

const roles = [
  { _id: ROLES.STUDENT, role_name: "student", description: "Applicant" },
  { _id: ROLES.AGENT, role_name: "agent", description: "Consultant" },
  { _id: ROLES.ADMIN, role_name: "admin", description: "Administrator" },
];

const users = [
  {
    _id: USERS.ADMIN,
    first_name: "Super",
    last_name: "Admin",
    email: "admin@admin.com",
    password: "adminPass123",
    phone: "+0000000000",
    date_of_birth: "1980-01-01",
    gender: "Other",
    nationality: "Global",
    country_of_residence: "USA",
    role: ROLES.ADMIN,
    is_verified: true,
  },
  {
    _id: USERS.AGENT,
    first_name: "James",
    last_name: "Bond",
    email: "agent@agency.com",
    password: "agentPassword123",
    phone: "+1987654321",
    date_of_birth: "1985-05-20",
    gender: "Male",
    nationality: "UK",
    country_of_residence: "UK",
    role: ROLES.AGENT,
    is_verified: true,
    agent_profile: new mongoose.Types.ObjectId("64b0f1a2c9e77b9999999999"), // Link to Agent Profile
  },
  {
    _id: USERS.STUDENT,
    first_name: "Alice",
    last_name: "Wonderland",
    email: "student@test.com",
    password: "studentPassword123",
    phone: "+1234567890",
    date_of_birth: "2000-01-15",
    gender: "Female",
    nationality: "Canada",
    country_of_residence: "Canada",
    role: ROLES.STUDENT,
    is_verified: true,
  },
];

const agents = [
  {
    _id: new mongoose.Types.ObjectId("64b0f1a2c9e77b9999999999"),
    user: USERS.AGENT,
    bio: "Top tier consultant for UK and US admissions.",
    specializations: ["UK", "USA", "MBA"],
    rating: 4.8,
    status: "active",
  },
];

const universities = [
  {
    _id: UNIVERSITIES.MIT,
    name: "Massachusetts Institute of Technology",
    country: "USA",
    city: "Cambridge",
    description: "Top technical university.",
    website_url: "https://mit.edu",
    rankings: { qs: 1, times: 2, us_news: 2 },
  },
];

const programs = [
  {
    _id: PROGRAMS.CS_PHD,
    university: UNIVERSITIES.MIT,
    program_name: "PhD in Computer Science",
    degree_level: "PhD",
    field_of_study: "Computer Science",
    description: "Advanced research in CS.",
    duration: "5 years",
    tuition_fee: 55000,
    requirements: { gpa: "3.8", ielts: 7.5, gre: 320 },
    intakes: [{ season: "Fall", year: 2025, deadline: new Date("2024-12-15") }],
  },
];

const courses = [
  {
    program: PROGRAMS.CS_PHD,
    course_name: "Advanced Algorithms",
    course_code: "CS-800",
    description: "Deep dive into algo complexity.",
    credits: "4",
  },
];

const scholarships = [
  {
    scholarship_name: "MIT Merit Grant",
    university: UNIVERSITIES.MIT,
    program: PROGRAMS.CS_PHD,
    description: "Full funding for top students.",
    amount: "100% Tuition",
  },
];

const data = { roles, users, agents, universities, programs, courses, scholarships };

module.exports = {
  data,
  roles,
  users,
  agents,
  universities,
  programs,
  courses,
  scholarships,
};
