import { z } from 'zod';

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  VIDEO: ['video/mp4', 'video/quicktime'],
} as const;

export const FileTypeEnum = z.enum(['IMAGE', 'DOCUMENT', 'VIDEO']);

export const ImageContentTypeSchema = z.enum(ALLOWED_FILE_TYPES.IMAGE);

export const S3PresignedUrlSchema = z.object({
  presignedUrl: z.string().url(),
  fileKey: z.string().min(1, 'S3 key is required'),
});

export const FileValidationSchema = z.object({
  fileType: FileTypeEnum,
  contentType: z.string(),
  maxSizeInMb: z.number().default(5),
});

export const S3ConfirmUploadSchema = z.object({
  fileKey: z.string().min(1, 'S3 key is required'),
});

export const S3ConfirmUploadResponseSchema = z.object({
  publicUrl: z.string().url(),
});
