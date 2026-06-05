import { randomUUID } from 'crypto';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { IS3Service } from '@core/interfaces/s3/s3.interface';

import { env } from '@infrastructure/configs/env.config';
import { LoggerService } from '@infrastructure/logger/logger-service';

@Injectable()
export class S3Service implements IS3Service {
  private readonly logger = new LoggerService(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = env.AWS_REGION || 'ap-southeast-1';
    this.bucket = env.AWS_BUCKET_NAME || 'kumakatok-assets-development';

    this.s3Client = this.initializeS3Client();
  }

  private initializeS3Client(): S3Client {
    const config: S3ClientConfig = {
      region: this.region,
    };

    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'local') {
      if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      }

      config.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
      };
    }

    return new S3Client(config);
  }

  private generateKey(id: string, prefix: string): string {
    const timestamp = Date.now();
    const uniqueId = randomUUID();
    return `${prefix}/${id}/${timestamp}-${uniqueId}`;
  }

  async generatePresignedUrl(
    userId: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; fileKey: string }> {
    try {
      const key = this.generateKey(userId, 'avatars');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      return {
        presignedUrl,
        fileKey: key,
      };
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  async generateStorefrontBannerPresignedUrl(
    userId: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; fileKey: string }> {
    try {
      const key = this.generateKey(userId, 'storefront-banners');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      return {
        presignedUrl,
        fileKey: key,
      };
    } catch (error) {
      this.logger.error('Error generating storefront banner presigned URL:', error);
      throw error;
    }
  }

  async generateListingPresignedUrl(
    listingId: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; fileKey: string }> {
    try {
      const key = this.generateKey(listingId, 'listing');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          listingId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      return {
        presignedUrl,
        fileKey: key,
      };
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  async generateBookingDocumentPresignedUrl(
    userId: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; fileKey: string }> {
    try {
      const key = this.generateKey(userId, 'booking-documents');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      return {
        presignedUrl,
        fileKey: key,
      };
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const exists = await this.objectExists(key);
      if (!exists) {
        this.logger.warn(`Object with key ${key} does not exist`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('Error deleting object from S3:', error);
      throw error;
    }
  }

  private async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
