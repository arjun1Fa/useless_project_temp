import { prisma } from '../db/client.js';
import { objectStorageService } from '../storage/object-storage.service.js';
import { NotFoundError } from '../utils/response.js';

export const attachmentService = {
  async upload(
    fileStream: NodeJS.ReadableStream,
    originalFilename: string,
    mimeType: string,
    size: number,
  ) {
    const stored = await objectStorageService.upload(fileStream, originalFilename, mimeType, size);

    const attachment = await prisma.attachment.create({
      data: {
        filename: stored.filename,
        mimeType: stored.mimeType,
        size: stored.size,
        storageKey: stored.storageKey,
      },
    });

    return attachment;
  },

  async getById(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError('Attachment');
    return attachment;
  },

  getLocalPath(storageKey: string): string {
    return objectStorageService.getLocalPath(storageKey);
  },
};
