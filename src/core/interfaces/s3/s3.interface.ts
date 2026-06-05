import { z } from 'zod';

import {
  S3PresignedUrlSchema,
  FileValidationSchema,
  FileTypeEnum,
  ImageContentTypeSchema,
} from '@core/schemas/s3.schema';

export type S3PresignedUrlOutput = z.infer<typeof S3PresignedUrlSchema>;
export type FileValidation = z.infer<typeof FileValidationSchema>;

export type FileType = z.infer<typeof FileTypeEnum>;
export type AllowedContentType = z.infer<typeof ImageContentTypeSchema>;

export interface IS3Service {
  generatePresignedUrl(userId: string, contentType: string): Promise<S3PresignedUrlOutput>;
  generateStorefrontBannerPresignedUrl(
    userId: string,
    contentType: string,
  ): Promise<S3PresignedUrlOutput>;
  generateListingPresignedUrl(
    listingId: string,
    contentType: string,
  ): Promise<S3PresignedUrlOutput>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  extractKeyFromUrl(url: string): string | null;
}
