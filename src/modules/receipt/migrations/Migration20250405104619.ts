import { Migration } from '@mikro-orm/migrations';

export class Migration20250405104619 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "receipt_image" ("id" text not null, "url" text not null, "mimeType" text not null, "order_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "receipt_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_receipt_image_deleted_at" ON "receipt_image" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "receipt_image" cascade;`);
  }

}
