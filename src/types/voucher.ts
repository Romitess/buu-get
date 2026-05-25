export interface VoucherData {
  id: number;
  fullName: string;
  studentId: string;
  examName: string;
  examDate: string;
  examTime: string;
  examType: string;
  location: string;
  seatNo: string;
  voucherNo: string;
  citizenId?: string | undefined;
  testSession?: string | undefined;
  profileImage?: string | undefined;
  barcodeValue?: string | undefined;
}
