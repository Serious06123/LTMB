import { io, Socket } from 'socket.io-client';

type MessagePayload = {
  orderId: string;
  receiverId: string;
  content: string;
  messageType?: string;
};

class SocketService {
  private socket: Socket | null = null;
  private url: string = '';
  private token: string | null = null;

  init(url: string, token?: string) {
    this.url = url;
    this.token = token || null;
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    const opts: any = { transports: ['websocket'], autoConnect: true };
    if (this.token) opts.auth = { token: `Bearer ${this.token}` };

    this.socket = io(this.url, opts);

    this.socket.on('connect_error', (err: any) => {
      console.warn('Socket connect_error', err.message || err);
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }

  on(event: string, cb: (...args: any[]) => void) {
    this.socket?.on(event, cb);
  }

  off(event: string, cb?: (...args: any[]) => void) {
    if (!this.socket) return;
    if (cb) this.socket.off(event, cb);
    else this.socket.off(event);
  }

  joinOrder(orderId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('join_order', { orderId });
  }

  // Hybrid send: optimistic emit (socket) then call GraphQL mutation to persist
  async sendMessage(payload: MessagePayload) {
    // optimistic emit
    try {
      this.socket?.emit('send_message', payload);
    } catch (e) {
      // ignore
    }

    // call GraphQL mutation to persist and let server broadcast
    try {
      const res = await this.sendMessageGraphQL(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  async sendMessageGraphQL({
    orderId,
    receiverId,
    content,
    messageType = 'text',
  }: MessagePayload) {
    const graphqlUrl = `${this.url.replace(/\/$/, '')}/graphql`;
    const body = {
      query: `mutation SendMessage($orderId: ID!, $receiverId: ID!, $content: String!, $messageType: String) { sendMessage(orderId: $orderId, receiverId: $receiverId, content: $content, messageType: $messageType) { _id orderId senderId senderName receiverId content messageType isRead createdAt } }`,
      variables: { orderId, receiverId, content, messageType },
    };

    const headers: any = { 'Content-Type': 'application/json' };
    if (this.token) headers['token'] = `Bearer ${this.token}`;

    const resp = await fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const json = await resp.json();
    if (json.errors)
      throw new Error(json.errors[0]?.message || 'GraphQL error');
    return json.data.sendMessage;
  }

  setToken(token: string) {
    this.token = token;
    // update auth for existing socket
    if (this.socket && !this.socket.connected) {
      // reconnect with new token
      this.disconnect();
      this.connect();
    }
  }
}

const socketService = new SocketService();
export default socketService;
