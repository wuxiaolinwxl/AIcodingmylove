import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Couple } from '../../entities/couple.entity';
import { ChatService } from './chat.service';
import { PushService } from '../push/push.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private presence = new Map<number, Map<number, Set<string>>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private pushService: PushService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Couple)
    private coupleRepo: Repository<Couple>,
  ) {}

  private addSocket(coupleId: number, userId: number, socketId: string): boolean {
    let users = this.presence.get(coupleId);
    if (!users) {
      users = new Map();
      this.presence.set(coupleId, users);
    }
    let sockets = users.get(userId);
    const firstSocket = !sockets || sockets.size === 0;
    if (!sockets) {
      sockets = new Set();
      users.set(userId, sockets);
    }
    sockets.add(socketId);
    return firstSocket;
  }

  private removeSocket(coupleId: number, userId: number, socketId: string): boolean {
    const users = this.presence.get(coupleId);
    if (!users) return false;
    const sockets = users.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      users.delete(userId);
      if (users.size === 0) this.presence.delete(coupleId);
      return true;
    }
    return false;
  }

  private onlineUsers(coupleId: number): number[] {
    const users = this.presence.get(coupleId);
    if (!users) return [];
    return [...users.keys()];
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token as string);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.coupleId) throw new Error('Unauthorized');

      (client as any).userId = user.id;
      (client as any).coupleId = user.coupleId;
      client.join(`couple_${user.coupleId}`);

      const firstSocket = this.addSocket(user.coupleId, user.id, client.id);
      const online = this.onlineUsers(user.coupleId);

      client.emit('connected', { userId: user.id, coupleId: user.coupleId, online });

      if (firstSocket) {
        client.to(`couple_${user.coupleId}`).emit('presence', { userId: user.id, online: true });
      }
    } catch {
      client.emit('error', { message: '认证失败' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    const coupleId = (client as any).coupleId;
    if (!userId || !coupleId) return;
    const wentOffline = this.removeSocket(coupleId, userId, client.id);
    if (wentOffline) {
      this.server.to(`couple_${coupleId}`).emit('presence', { userId, online: false });
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { msgType: 'text' | 'image' | 'file'; content?: string; ossKey?: string; fileName?: string; fileSize?: number; replyToId?: number },
  ) {
    const userId = (client as any).userId;
    const coupleId = (client as any).coupleId;

    const msg = await this.chatService.createMessage({
      coupleId,
      senderId: userId,
      msgType: data.msgType,
      content: data.content,
      ossKey: data.ossKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: data.replyToId,
    });

    this.server.to(`couple_${coupleId}`).emit('message:new', msg);

    this.notifyPartnerIfOffline(coupleId, userId, msg).catch(() => {});
  }

  private async notifyPartnerIfOffline(coupleId: number, senderId: number, msg: any) {
    const couple = await this.coupleRepo.findOne({ where: { id: coupleId } });
    if (!couple) return;
    const partnerId = couple.userAId === senderId ? couple.userBId : couple.userAId;
    if (!partnerId) return;
    const users = this.presence.get(coupleId);
    const partnerOnline = !!users?.get(partnerId)?.size;
    if (partnerOnline) return;

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    const senderName = sender?.nickname || sender?.username || '对方';
    let body = '';
    if (msg.msgType === 'text') {
      body = (msg.content || '').slice(0, 80);
    } else if (msg.msgType === 'image') {
      body = '[图片]';
    } else if (msg.msgType === 'file') {
      body = `[文件] ${msg.fileName || ''}`.trim();
    }
    await this.pushService.sendToUser(partnerId, {
      title: `${senderName} 给你发来一条消息`,
      body: body || '点击查看',
      url: '/chat',
      tag: `chat-${coupleId}`,
      icon: '/heart.svg',
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    const coupleId = (client as any).coupleId;
    client.to(`couple_${coupleId}`).emit('typing', { userId });
  }

  @SubscribeMessage('read')
  async handleRead(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    const coupleId = (client as any).coupleId;
    await this.chatService.markRead(coupleId, userId);
    client.to(`couple_${coupleId}`).emit('read', { readerId: userId, at: new Date() });
  }
}
