import { Injectable, OnModuleInit, HttpException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async uploadFile(bucketName: string, file: Express.Multer.File) {
    try {
      const sanitizedName = file.originalname
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/[^a-zA-Z0-9._-]/g, ''); // remove special characters

      const fileName = `${bucketName}/${Date.now()}-${sanitizedName}`;
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer);

      if (error) {
        throw new HttpException(
          {
            message: error.message,
          },
          500,
        );
      }
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrlData?.publicUrl;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message,
        },
        500,
      );
    }
  }

  async deleteFile(fileUrl: string) {
    try {
      const path = fileUrl.split('/storage/v1/object/public/avatars/')[1];
      const { error } = await this.supabase.storage
        .from('avatars')
        .remove([path]);

      if (error) {
        throw new HttpException(
          {
            message: 'Failed to delete old avatar: ' + error.message,
          },
          500,
        );
      }
    } catch (err) {
      throw new HttpException(
        {
          message: 'Failed to delete old avatar: ' + err.message,
        },
        500,
      );
    }
  }
}
