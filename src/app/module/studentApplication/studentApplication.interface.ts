export interface IApplyStudentApplication {
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  studentApplication: {
    programId: string;
    batch: string;
    address: string;
    emergencyPhone?: string;
  };
}

// ২. ইমেইল ভেরিফিকেশন ইন্টারফেস
export interface IVerifyEmailInput {
  email: string;
  otp: string;
}

// ৩. অ্যাপ্লিকেশন অ্যাপ্রুভ ইন্টারফেস
export interface IApproveApplicationInput {
  applicationId: string;
}

// ৪. অ্যাপ্লিকেশন রিজেক্ট ইন্টারফেস
export interface IRejectApplicationInput {
  applicationId: string;
  reason: string;
}