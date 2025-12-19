export interface Task {
  id: string;
  title: string;
  description: string;
  scheduled_time: Date;
  discord_webhook_url: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  scheduled_time: string;
  discord_webhook_url: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  scheduled_time?: string;
  discord_webhook_url?: string;
  is_active?: boolean;
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}
