// This is just an example, can be any-nested-object
export default {
  failed: 'Action failed',
  success: 'Action was successful',
  exam: {
    status: {
      pending: 'Pending Payment',
      verifying: 'Verifying',
      verified: 'Verified',
      evaluating: 'Awaiting Evaluation',
      completed: 'Completed',
      cancelled: 'Cancelled',
      passed: 'Passed',
      failed: 'Failed',
      paymentTimeout: 'Payment Timeout',
    },
    history: {
      fee: 'Fee',
      pay: 'Pay Now',
      cancel: 'Cancel Registration',
      downloadReceipt: 'Download Receipt',
      paymentDeadline: 'Payment deadline',
    },
  },
};
