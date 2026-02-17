"use client";

import { apiCall } from "next-workflow-builder/lib/api-client";

type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

type SlackChannelsResponse = {
  channels: SlackChannel[];
};

export const slackApi = {
  getChannels: () =>
    apiCall<SlackChannelsResponse>("/api/slack/channels"),
};
