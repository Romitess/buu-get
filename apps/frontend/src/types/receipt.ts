export interface ReceiptData {
  receiptNo: string;
  transactionDate: string;
  fullName: string;
  nationalId: string;
  address?: string;
  examName: string;
  examDate: string;
  location: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  verifyCode?: string;
  qrDataUrl?: string;
}
/** ตำแหน่ง (px ของใบเสร็จ) และขนาดของลายเซ็นภายในช่อง «ภาพลายมือชื่อ» */
export interface SignaturePlacement {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface ReceiptCardProps {
  receipt: ReceiptData;
  showQr?: boolean;
  isCopy?: boolean;
  /** รูปลายเซ็น e-sign ที่จะวางแทนข้อความ «ภาพลายมือชื่อ» */
  signatureImageUrl?: string;
  /** ชื่อผู้รับเงินที่แสดงใต้ช่องลายเซ็น */
  collectorName?: string;
  signaturePlacement?: SignaturePlacement;
}
