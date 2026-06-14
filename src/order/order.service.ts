import {
  Injectable,
  HttpException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma.service';
import { OrderItemInput } from './dto/orderItemInput.dto';
import { OrderInput } from './dto/orderInput.dto';
import { PaymentService } from 'src/lib/payment.service';
import { OrderWhereInput } from 'src/generated/prisma/models';
import { PaymentStatus } from 'src/generated/prisma/enums';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  private async isAvailable(ticketTypeId: string, quantity: number) {
    const ticket = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Invalid TicketId');
    }

    if (ticket.quantityAvailable < 1) {
      return `${ticket.name} for ${ticket.event.title} is sold out`;
    }

    if (ticket.quantityAvailable < quantity) {
      return `Not enough tickets available `;
    }

    return ticket;
  }

  async createOrderItem(userId: string, itemInput: OrderItemInput) {
    try {
      const { ticketTypeId, quantity } = itemInput;

      const ticket = await this.isAvailable(ticketTypeId, quantity);

      if (typeof ticket === 'string') {
        throw new HttpException('Ticket is not available', 500);
      }

      await this.prisma.orderItem.create({
        data: {
          userId,
          eventId: ticket.event.id,
          ticketTypeId: ticket.id,
          quantity,
          unitPrice: ticket.price,
          subtotal: ticket.price * quantity,
        },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async createOrder(userId: string, email: string, orderInput: OrderInput) {
    try {
      const { promoCodeId, orderItemIds, currency } = orderInput;
      let itemSubtotal: number[] = [];

      for (let i = 0; i < orderItemIds.length; i++) {
        const item = await this.prisma.orderItem.findUnique({
          where: { id: orderItemIds[i] },
          select: { subtotal: true, ticketTypeId: true, quantity: true },
        });

        if (!item) {
          throw new BadRequestException('Invalid OrderItemId');
        }

        await this.isAvailable(item.ticketTypeId, item.quantity);

        itemSubtotal.push(item.subtotal);
      }

      const totalAmount = itemSubtotal.reduce((acc, curr) => acc + curr, 0);

      const data = await this.paymentService.initializeTransaction(
        email,
        totalAmount * 100,
      );

      const order = await this.prisma.order.create({
        data: {
          userId,
          orderItemId: orderItemIds,
          promoCodeId,
          totalAmount,
          currency,
          paymentReference: data.reference,
          paymentProvider: 'paystack',
        },
      });

      setImmediate(async () => {
        try {
          for (let i = 0; i < orderItemIds.length; i++) {
            await this.prisma.orderItem.update({
              where: { id: orderItemIds[i] },
              data: { orderId: order.id },
            });
          }
        } catch (err) {
          console.error(
            'OrderItem.OrderId update failed: ' + err.message,
            err.status,
          );
        }
      });

      return {
        orderId: order.id,
        totalAmount: order.totalAmount,
        currency,
        paymentReference: data.reference,
        paymentUrl: data.authorization_url,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async findById(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItem: {
            select: {
              ticketType: {
                select: {
                  name: true,
                  price: true,
                  event: { select: { title: true, slug: true } },
                },
              },
              quantity: true,
              unitPrice: true,
              subtotal: true,
            },
          },
        },
      });
      if (!order) {
        throw new BadRequestException('Invalid OrderId');
      }

      return order;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async findUserOrder(userId: string, paymentStatus?: PaymentStatus) {
    try {
      const page = 1;
      const limit = 10;

      const where: OrderWhereInput = {
        userId,
        ...(paymentStatus && { paymentStatus }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
        }),

        this.prisma.order.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const hash = crypto
        .createHmac('sha512', this.config.get<string>('PAYSTACK_SECRET_KEY')!)
        .update(req.rawBody!)
        .digest('hex');

      if (hash !== signature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      const event = req.body as any;

      switch (event.event) {
        case 'charge.success':
          await this.handlePaymentSuccess(event.data);
          break;
        case 'charge.failed':
          await this.handlePaymentFailure(event.data);
          break;

        default:
          break;
      }
      return { received: true };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  private async handlePaymentSuccess(data: any) {}
  private async handlePaymentFailure(data: any) {}
}
