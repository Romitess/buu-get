import { api } from 'src/boot/axios';

export const downloadReceipt = async (tranxId: number): Promise<void> => {
  const response = await api.get(`/receipts/${tranxId}/download`, {
    responseType: 'blob', // Important for downloading files
  });

  // Create a URL for the blob and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Try to extract filename from content-disposition header if present
  const contentDisposition = response.headers['content-disposition'];
  let filename = `receipt-${tranxId}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
