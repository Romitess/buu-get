import { All, Body, Controller, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { BankCallbackRequestDto } from './dto/bank-callback-request.dto';
import { BillApprovalService } from './services/bill-approval.service';
import { BillPaymentService } from './services/bill-payment.service';
import { MockBankService } from './services/mock-bank.service';
import { PaymentMode } from './constants/payment-mode';

@ApiTags('Bank Callbacks')
@Controller()
export class BankCallbackController {
  constructor(
    private readonly billApprovalService: BillApprovalService,
    private readonly billPaymentService: BillPaymentService,
    private readonly mockBankService: MockBankService,
  ) {}

  @Public()
  @All('approval')
  @ApiOperation({ summary: 'Bank bill approval callback (public)' })
  async approval(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: BankCallbackRequestDto,
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        STATUS: 'FALSE',
        RESPONSE_MESSAGE: '405 Method Not Allowed',
      });
      return;
    }

    if (this.mockBankService.getPaymentMode() === PaymentMode.CSV) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: 'Bank callback APIs are disabled when PAYMENT_MODE=csv',
        error: 'Service Unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
      return;
    }

    const result = await this.billApprovalService.approve(body);
    res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @All('payment')
  @ApiOperation({ summary: 'Bank payment confirmation callback (public)' })
  async payment(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: BankCallbackRequestDto,
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        STATUS: 'FALSE',
        RESPONSE_MESSAGE: '405 Method Not Allowed',
      });
      return;
    }

    if (this.mockBankService.getPaymentMode() === PaymentMode.CSV) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: 'Bank callback APIs are disabled when PAYMENT_MODE=csv',
        error: 'Service Unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
      return;
    }

    const result = await this.billPaymentService.payment(body);
    res.status(HttpStatus.OK).json(result);
  }
}
