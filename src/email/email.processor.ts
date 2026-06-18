import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Processor('email', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }
  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'confirmation':
        await this.sendConfirmationEmail(job.data);
        break;

      case 'reminder':
        await this.sendEventReminder(job.data);
        break;

      case 'cancellation':
        await this.sendCancellationEmail(job.data);
        break;

      default:
        break;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started processing`);
  }

  private async sendConfirmationEmail(data: {
    email: string;
    attendeeName: string;
    eventTitle: string;
    ticketCode: string;
    qrCodeUrl: string;
  }) {
  }

  private async sendEventReminder(data: {
    email: string;
    eventTitle: string;
    startTime: Date;
  }) {
  }

  private async sendCancellationEmail(data: {
    email: string;
    eventTitle: string;
    reason: string;
  }) {
  }
}
