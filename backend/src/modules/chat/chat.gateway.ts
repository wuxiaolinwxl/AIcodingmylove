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
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token as string);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.coupleId) throw new Error('Unauthorized');

      (client as any).userId = user.id;
      (client as any).coupleId = user.coupleId;
      client.join(`couple_${user.coupleId}`);
      client.emit('connected', { userId: user.id, coupleId: user.coupleId });
    } catch {
      client.emit('error', { message: '认证失败' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { msgType: 'text' | 'image' | 'file'; content?: string; ossKey?: string; fileName?: string; fileSize?: number },
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
    });

    this.server.to(`couple_${coupleId}`).emit('message:new', msg);
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
