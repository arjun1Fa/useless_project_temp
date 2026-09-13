import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export async function requestIdHook(request: FastifyRequest, _reply: FastifyReply) {
  // Use existing x-request-id header if provided by a proxy/client, otherwise generate
  const existing = request.headers['x-request-id'];
  request.id = (typeof existing === 'string' ? existing : uuidv4());
}
