// =============== 웹소켓 설정 ===============
export class SocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 5;
        this.RECONNECT_INTERVAL = 3000;
        this.messageHandlers = new Map();
    }

    connect(roomId, onMessageReceived, onStatusChange) {
        this.ws = new WebSocket(`${WS_URL}/chat/${roomId}`);

        this.ws.onopen = () => {
            console.log('WebSocket 연결 성공');
            this.reconnectAttempts = 0;
            onStatusChange?.('connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
                onMessageReceived?.(message);
            } catch (error) {
                console.error('메시지 파싱 오류:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 오류:', error);
            onStatusChange?.('error');
        };

        this.ws.onclose = this.handleClose(roomId, onStatusChange);
    }

    handleClose(roomId, onStatusChange) {
        return (event) => {
            console.log('WebSocket 연결 종료:', event.code, event.reason);
            onStatusChange?.('disconnected');

            if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    this.connect(roomId, null, onStatusChange);
                    this.reconnectAttempts++;
                }, this.RECONNECT_INTERVAL);
            } else {
                onStatusChange?.('max_attempts_reached');
            }
        };
    }

    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    close() {
        this.ws?.close();
    }
}

export default new SocketService();