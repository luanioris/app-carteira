create table metas (
  id uuid default gen_random_uuid() primary key,
  carteira_id uuid references carteiras(id) on delete cascade not null,
  objetivo_patrimonio numeric not null,
  data_alvo date,
  created_at with time zone default timezone('utc'::text, now()) not null,
  unique(carteira_id)
);

-- RLS
alter table metas enable row level security;

create policy "Usuários podem ver metas de suas carteiras"
on metas for select
using (
  exists (
    select 1 from carteiras
    where carteiras.id = metas.carteira_id
    and carteiras.user_id = auth.uid()
  )
);

create policy "Usuários podem criar metas para suas carteiras"
on metas for insert
with check (
  exists (
    select 1 from carteiras
    where carteiras.id = metas.carteira_id
    and carteiras.user_id = auth.uid()
  )
);

create policy "Usuários podem atualizar metas de suas carteiras"
on metas for update
using (
  exists (
    select 1 from carteiras
    where carteiras.id = metas.carteira_id
    and carteiras.user_id = auth.uid()
  )
);
