export interface MemoryOtpRecord {
  hashedOtp: string;
  expiresAt: Date;
  phoneNumber: string;
  verifyAttempts: number;
  sendAttempts: number;
  lastSentAt: Date;
}

const memoryOtpMap = new Map<string, MemoryOtpRecord>();

export const memoryOtpStore = {
  get: (phone: string) => memoryOtpMap.get(phone),
  set: (phone: string, record: MemoryOtpRecord) => memoryOtpMap.set(phone, record),
  delete: (phone: string) => memoryOtpMap.delete(phone),
};
