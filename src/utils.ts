import { RawData } from 'ws';
import { Message } from './types/types';

export const parseRequestData = (request: RawData) => {
  const parsedRequest = JSON.parse(request.toString());
  parsedRequest.data = parsedRequest.data.length
    ? JSON.parse(parsedRequest.data)
    : parsedRequest.data;
  return parsedRequest;
};

export const getMessageWithSerializedData = (message: Message) => {
  return typeof message.data === 'object'
    ? { ...message, data: JSON.stringify(message.data) }
    : message;
};
