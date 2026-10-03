import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  ownerId: text('owner_id').notNull(),
  id: text('id').notNull(),
  name: text('name').notNull(),
  whatsapp: text('whatsapp').notNull(),
  licensePlate: text('license_plate').notNull().default(''),
  chassisNumber: text('chassis_number').notNull().default(''),
  engineNumber: text('engine_number').notNull().default(''),
  purchaseDate: text('purchase_date').notNull(),
  status: text('status').notNull(),
  rescheduleDate: text('reschedule_date').notNull().default(''),
  cancelReason: text('cancel_reason').notNull().default(''),
  notes: text('notes').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.id] })]);
