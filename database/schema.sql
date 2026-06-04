-- Habilitar extensión para UUIDs si no está habilitada
create extension if not exists "uuid-ossp";

-- Crear enum para el tipo de movimiento
create type tipo_movimiento as enum ('gasto', 'ingreso');

-- Crear tabla de movimientos
create table movimientos (
    id uuid default gen_random_uuid() primary key,
    fecha timestamptz default now() not null,
    tipo tipo_movimiento not null,
    monto numeric(12, 2) not null check (monto > 0),
    concepto text not null,
    categoria text not null,
    metodo_pago text not null,
    confirmado boolean default false not null,
    chat_id bigint not null,
    created_at timestamptz default now() not null
);

-- Crear tabla de sesiones del bot de Telegram para almacenar estados parciales
create table bot_sessions (
    chat_id bigint primary key,
    estado text not null, -- 'esperando_metodo_pago', 'esperando_tipo', etc.
    datos_parciales jsonb default '{}'::jsonb not null,
    updated_at timestamptz default now() not null
);

-- Crear índices para optimizar consultas en la web
create index idx_movimientos_fecha on movimientos(fecha desc);
create index idx_movimientos_categoria on movimientos(categoria);
create index idx_movimientos_confirmado on movimientos(confirmado);

-- RLS (Row Level Security) - Políticas de seguridad iniciales permisivas
alter table movimientos enable row level security;
alter table bot_sessions enable row level security;

create policy "Permitir todo a usuarios autenticados y servicio del bot"
on movimientos for all
using (true)
with check (true);

create policy "Permitir todo a sesiones"
on bot_sessions for all
using (true)
with check (true);
