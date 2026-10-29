-- Feature 004-persistir-dados-clinicos
-- Executar uma vez no SQL Editor do painel do Supabase (projeto já usado pela spec
-- 002-auth-supabase). Não há Supabase CLI/migrations neste repositório — ver
-- research.md, Decisão 1.
--
-- Pré-requisito: Supabase Auth já configurado (spec 002); `auth.users` já existe.

-- ===========================================================================
-- pacientes
-- ===========================================================================
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  psicologa_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  iniciais text not null,
  frequencia text not null check (frequencia in ('Semanal', 'Quinzenal', 'Mensal')),
  dia_fixo smallint not null check (dia_fixo between 0 and 6),
  hora_fixa text not null check (hora_fixa ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  modalidade text not null check (modalidade in ('Presencial', 'Online')),
  valor_sessao numeric(10, 2) not null check (valor_sessao >= 0),
  desde date not null,
  telefone text not null,
  created_at timestamptz not null default now()
);

create index pacientes_psicologa_id_idx on public.pacientes (psicologa_id);

alter table public.pacientes enable row level security;

create policy "pacientes_select_own" on public.pacientes
  for select using (psicologa_id = auth.uid());
create policy "pacientes_insert_own" on public.pacientes
  for insert with check (psicologa_id = auth.uid());
create policy "pacientes_update_own" on public.pacientes
  for update using (psicologa_id = auth.uid()) with check (psicologa_id = auth.uid());
create policy "pacientes_delete_own" on public.pacientes
  for delete using (psicologa_id = auth.uid());

-- ===========================================================================
-- sessoes
-- ===========================================================================
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  psicologa_id uuid not null references auth.users (id) on delete cascade,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  data date not null,
  hora text not null check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  status text not null check (status in ('pendente', 'confirmada', 'realizada', 'faltou', 'remarcada')),
  modalidade text not null check (modalidade in ('Presencial', 'Online')),
  valor numeric(10, 2) not null check (valor >= 0),
  duracao_min smallint not null check (duracao_min > 0),
  created_at timestamptz not null default now()
);

create index sessoes_psicologa_id_idx on public.sessoes (psicologa_id);
create index sessoes_paciente_id_idx on public.sessoes (paciente_id);
create index sessoes_data_idx on public.sessoes (data);

alter table public.sessoes enable row level security;

create policy "sessoes_select_own" on public.sessoes
  for select using (psicologa_id = auth.uid());
create policy "sessoes_insert_own" on public.sessoes
  for insert with check (psicologa_id = auth.uid());
create policy "sessoes_update_own" on public.sessoes
  for update using (psicologa_id = auth.uid()) with check (psicologa_id = auth.uid());
create policy "sessoes_delete_own" on public.sessoes
  for delete using (psicologa_id = auth.uid());

-- ===========================================================================
-- lancamentos
-- ===========================================================================
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  psicologa_id uuid not null references auth.users (id) on delete cascade,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  sessao_id uuid references public.sessoes (id) on delete restrict,
  data date not null,
  valor numeric(10, 2) not null check (valor >= 0),
  pago boolean not null default false,
  metodo text check (metodo in ('Pix', 'Cartão', 'Dinheiro', 'Convênio')),
  cobrado boolean not null default false,
  created_at timestamptz not null default now()
);

create index lancamentos_psicologa_id_idx on public.lancamentos (psicologa_id);
create index lancamentos_paciente_id_idx on public.lancamentos (paciente_id);

alter table public.lancamentos enable row level security;

create policy "lancamentos_select_own" on public.lancamentos
  for select using (psicologa_id = auth.uid());
create policy "lancamentos_insert_own" on public.lancamentos
  for insert with check (psicologa_id = auth.uid());
create policy "lancamentos_update_own" on public.lancamentos
  for update using (psicologa_id = auth.uid()) with check (psicologa_id = auth.uid());
create policy "lancamentos_delete_own" on public.lancamentos
  for delete using (psicologa_id = auth.uid());

-- ===========================================================================
-- notas
-- ===========================================================================
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  psicologa_id uuid not null references auth.users (id) on delete cascade,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  sessao_id uuid references public.sessoes (id) on delete restrict,
  data date not null,
  texto text not null,
  created_at timestamptz not null default now()
);

create index notas_psicologa_id_idx on public.notas (psicologa_id);
create index notas_paciente_id_idx on public.notas (paciente_id);

alter table public.notas enable row level security;

create policy "notas_select_own" on public.notas
  for select using (psicologa_id = auth.uid());
create policy "notas_insert_own" on public.notas
  for insert with check (psicologa_id = auth.uid());
create policy "notas_update_own" on public.notas
  for update using (psicologa_id = auth.uid()) with check (psicologa_id = auth.uid());
create policy "notas_delete_own" on public.notas
  for delete using (psicologa_id = auth.uid());
