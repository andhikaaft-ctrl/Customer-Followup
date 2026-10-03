CREATE TABLE "customers" (
	"owner_id" text,
	"id" text,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"license_plate" text DEFAULT '' NOT NULL,
	"chassis_number" text DEFAULT '' NOT NULL,
	"engine_number" text DEFAULT '' NOT NULL,
	"purchase_date" text NOT NULL,
	"status" text NOT NULL,
	"reschedule_date" text DEFAULT '' NOT NULL,
	"cancel_reason" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "customers_pkey" PRIMARY KEY("owner_id","id")
);
