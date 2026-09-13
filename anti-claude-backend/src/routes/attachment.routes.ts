import { FastifyInstance } from 'fastify';
import { attachmentService } from '../services/attachment.service.js';
import { sendSuccess } from '../utils/response.js';
import { createReadStream } from 'fs';

export async function attachmentRoutes(app: FastifyInstance) {
  // POST /api/v1/attachments
  app.post('/attachments', {
    schema: { tags: ['attachments'], summary: 'Upload a file/image attachment' },
  }, async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const attachment = await attachmentService.upload(
      data.file,
      data.filename,
      data.mimetype,
      data.file.bytesRead ?? 0,
    );

    return sendSuccess(reply, attachment, 201);
  });

  // GET /api/v1/attachments/:attachmentId
  app.get('/attachments/:attachmentId', {
    schema: { tags: ['attachments'], summary: 'Download an attachment' },
  }, async (req, reply) => {
    const { attachmentId } = req.params as { attachmentId: string };
    const attachment = await attachmentService.getById(attachmentId);
    const filePath = attachmentService.getLocalPath(attachment.storageKey);

    reply.header('Content-Type', attachment.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${attachment.filename}"`);

    return reply.send(createReadStream(filePath));
  });
}
