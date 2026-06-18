import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async sendConfirmationEmail(data: {
    email: string;
    attendeeName: string;
    eventTitle: string;
    ticketCode: string;
    qrCodeUrl: string;
  }) {
    await this.emailQueue.add('confirmation', data, {
      attempts: 3, // retry 3 times if it fails
      backoff: {
        type: 'exponential', // wait longer between each retry
        delay: 5000, // start with 5 seconds
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendEventReminder(data: {
    email: string;
    eventTitle: string;
    startTime: Date;
  }) {
    const delay =
      new Date(data.startTime).getTime() - Date.now() - 24 * 60 * 60 * 1000;

    await this.emailQueue.add('reminder', data, {
      delay, //runs 24 hours before the event
      attempts: 3,
    });
  }
  async sendCancellationEmail(data: {
    email: string;
    eventTitle: string;
    reason: string;
  }) {
    await this.emailQueue.add('cancellation', data, {
      attempts: 3,
    });
  }
}
