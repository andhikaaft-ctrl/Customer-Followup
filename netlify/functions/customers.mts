import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { customers } from '../../db/schema.js';
import { sanitize } from '../../src/utils/io.js';
import type { Customer } from '../../src/types/index.js';

const headers = { 'Cache-Control': 'no-store' };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
const publicCustomer = ({ ownerId: _ownerId, ...customer }: typeof customers.$inferSelect) => customer;

export default async (request: Request) => {
  const user = await getUser();
  if (!user) return reply({ error: 'Silakan masuk untuk mengakses data customer.' }, 401);
  const owner = eq(customers.ownerId, user.id);
  const list = async () => (await db.select().from(customers).where(owner).orderBy(asc(customers.createdAt))).map(publicCustomer);

  if (request.method !== 'GET') {
    try { verifyRequestOrigin(request); }
    catch { return reply({ error: 'Permintaan tidak diizinkan.' }, 403); }
  }

  try {
    if (request.method === 'GET') return reply(await list());
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, POST, PUT, PATCH, DELETE' } });
    }

    const text = await request.text();
    if (text.length > 2_000_000) return reply({ error: 'Data terlalu besar.' }, 413);
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      body = parsed as Record<string, unknown>;
    } catch { return reply({ error: 'Format data tidak valid.' }, 400); }

    if (request.method === 'DELETE') {
      if (typeof body.id !== 'string' || !body.id) return reply({ error: 'ID customer tidak valid.' }, 400);
      await db.delete(customers).where(and(owner, eq(customers.id, body.id)));
      return reply({ ok: true });
    }

    if (request.method === 'PUT' || (request.method === 'POST' && Array.isArray(body.customers))) {
      if (!Array.isArray(body.customers) || body.customers.length > 5000) {
        return reply({ error: 'Daftar customer tidak valid atau melebihi 5.000 baris.' }, 400);
      }
      const rows = body.customers.map(sanitize);
      if (rows.some((row) => !row) || new Set(rows.map((row) => row?.id)).size !== rows.length) {
        return reply({ error: 'Data customer tidak valid atau ID duplikat.' }, 400);
      }
      const valid = rows as Customer[];
      await db.transaction(async (transaction) => {
        if (request.method === 'PUT') await transaction.delete(customers).where(owner);
        for (let offset = 0; offset < valid.length; offset += 100) {
          await transaction.insert(customers).values(valid.slice(offset, offset + 100).map((row) => ({ ...row, ownerId: user.id }))).onConflictDoNothing();
        }
      });
      return reply(await list());
    }

    const customer = sanitize(body.customer);
    if (!customer) return reply({ error: 'Nama, WhatsApp, atau tanggal pembelian tidak valid.' }, 400);
    const now = new Date().toISOString();
    if (request.method === 'POST') {
      const [created] = await db.insert(customers).values({ ...customer, id: crypto.randomUUID(), createdAt: now, updatedAt: now, ownerId: user.id }).returning();
      return reply(publicCustomer(created), 201);
    }
    if (typeof body.id !== 'string' || !body.id) return reply({ error: 'ID customer tidak valid.' }, 400);
    const { id: _id, createdAt: _createdAt, ...input } = customer;
    const [updated] = await db.update(customers).set({ ...input, updatedAt: now }).where(and(owner, eq(customers.id, body.id))).returning();
    return updated ? reply(publicCustomer(updated)) : reply({ error: 'Customer tidak ditemukan.' }, 404);
  } catch {
    return reply({ error: 'Gagal mengakses database. Coba lagi.' }, 500);
  }
};

export const config = { path: '/api/customers' };
