import axios from 'axios';

interface TextMessage {
  type: 'text';
  text: string;
}

interface ImageMessage {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
}

interface TemplateMessage {
  type: 'template';
  altText: string;
  template: Record<string, unknown>;
}

type Message = TextMessage | ImageMessage | TemplateMessage;

export class LineMessagingService {
  private readonly baseUrl = 'https://api.line.me/v2/bot';
  private channelAccessToken: string;

  constructor(channelAccessToken: string) {
    this.channelAccessToken = channelAccessToken;
  }

  // プッシュメッセージを送信（特定のユーザーに送信）
  async pushMessage(to: string, messages: Message[]): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/message/push`,
        {
          to,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.channelAccessToken}`,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LINE API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to send LINE message');
      }
      throw error;
    }
  }

  // マルチキャストメッセージを送信（複数のユーザーに送信）
  async multicastMessage(to: string[], messages: Message[]): Promise<void> {
    if (to.length === 0) {
      throw new Error('At least one recipient is required');
    }

    try {
      await axios.post(
        `${this.baseUrl}/message/multicast`,
        {
          to,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.channelAccessToken}`,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LINE API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to send LINE multicast message');
      }
      throw error;
    }
  }

  // ブロードキャストメッセージを送信（全友だちに送信）
  async broadcastMessage(messages: Message[]): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/message/broadcast`,
        {
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.channelAccessToken}`,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LINE API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to send LINE broadcast message');
      }
      throw error;
    }
  }

  // ユーザープロファイルを取得
  async getUserProfile(userId: string): Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.channelAccessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LINE API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to get user profile');
      }
      throw error;
    }
  }

  // クイックリプライ付きメッセージを作成
  static createQuickReplyMessage(text: string, items: Array<{
    type: 'action';
    action: {
      type: 'message' | 'postback' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
      label: string;
      data?: string;
      text?: string;
      uri?: string;
    };
  }>): TextMessage & { quickReply: { items: typeof items } } {
    return {
      type: 'text',
      text,
      quickReply: {
        items,
      },
    };
  }

  // ボタンテンプレートメッセージを作成
  static createButtonTemplate(
    altText: string,
    title: string,
    text: string,
    actions: Array<{
      type: 'message' | 'uri' | 'postback';
      label: string;
      data?: string;
      text?: string;
      uri?: string;
    }>
  ): TemplateMessage {
    return {
      type: 'template',
      altText,
      template: {
        type: 'buttons',
        title,
        text,
        actions,
      },
    };
  }

  // 確認テンプレートメッセージを作成
  static createConfirmTemplate(
    altText: string,
    text: string,
    actions: [
      {
        type: 'message' | 'postback';
        label: string;
        data?: string;
        text?: string;
      },
      {
        type: 'message' | 'postback';
        label: string;
        data?: string;
        text?: string;
      }
    ]
  ): TemplateMessage {
    return {
      type: 'template',
      altText,
      template: {
        type: 'confirm',
        text,
        actions,
      },
    };
  }
}