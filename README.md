# 🏗️ ConstruMax — Sistema de Gestão de Estoque

Sistema web completo para loja de materiais de construção com cadastro de produtos, controle de entradas/saídas e alertas automáticos de reposição.

---

## 🗂 Estrutura do Projeto

```
construmax/
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js   # Conexão com Supabase
│   │   ├── routes/
│   │   │   ├── products.js   # CRUD de produtos
│   │   │   └── movimentacoes.js # Entradas/saídas + dashboard
│   │   └── index.js          # Servidor Express
│   ├── schema.sql            # ⚠️ Execute no Supabase primeiro!
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Visão geral e KPIs
    │   │   ├── Produtos.jsx        # CRUD de produtos
    │   │   ├── Movimentacoes.jsx   # Registrar entradas/saídas
    │   │   └── Alertas.jsx         # Produtos abaixo do mínimo
    │   ├── services/
    │   │   └── api.js              # Comunicação com o backend
    │   ├── styles/
    │   │   └── global.css          # Design system industrial
    │   ├── App.jsx                 # Roteamento + layout
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (gratuita)

---

## 🚀 Passo a Passo para Rodar

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No painel do projeto, vá em **SQL Editor**
3. Cole todo o conteúdo do arquivo `backend/schema.sql` e clique em **Run**
4. Isso cria as tabelas `produtos` e `movimentacoes` com dados de exemplo
5. Vá em **Project Settings → API** e copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_KEY`

### 2. Configurar o Backend

```bash
cd construmax/backend

# Copiar e preencher variáveis de ambiente
cp .env.example .env
```

Edite o `.env`:
```env
PORT=3001
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key_aqui
```

Instalar dependências e rodar:
```bash
npm install
npm run dev
```

O backend estará disponível em: `http://localhost:3001`

### 3. Configurar o Frontend

```bash
cd construmax/frontend

npm install
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

> O Vite está configurado com proxy: toda chamada para `/api` é redirecionada automaticamente para `http://localhost:3001`.

---

## 📡 Rotas da API

### Produtos — `/api/products`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Listar produtos (filtros: `search`, `categoria`, `alerta`) |
| GET | `/api/products/:id` | Buscar produto por ID |
| POST | `/api/products` | Criar produto |
| PUT | `/api/products/:id` | Atualizar produto |
| DELETE | `/api/products/:id` | Remover produto |
| GET | `/api/products/categorias/lista` | Listar categorias cadastradas |

**Exemplo de corpo para POST/PUT:**
```json
{
  "nome": "Cimento Portland CP-II",
  "codigo": "CIM-001",
  "categoria": "Cimento",
  "unidade": "saco",
  "preco_custo": 32.00,
  "preco_venda": 42.00,
  "estoque_inicial": 200,
  "estoque_minimo": 50,
  "fornecedor": "Votorantim",
  "descricao": "Saco 50kg - uso geral"
}
```

### Movimentações — `/api/movimentacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/movimentacoes` | Listar movimentações (filtros: `produto_id`, `tipo`, `limit`, `offset`) |
| POST | `/api/movimentacoes` | Registrar entrada ou saída |
| GET | `/api/movimentacoes/dashboard/stats` | Estatísticas para o dashboard |

**Exemplo de corpo para POST:**
```json
{
  "produto_id": "uuid-do-produto",
  "tipo": "saida",
  "quantidade": 10,
  "motivo": "Venda ao cliente",
  "responsavel": "João Silva",
  "observacao": "Pedido #1234"
}
```

**Resposta inclui alerta automático:**
```json
{
  "success": true,
  "data": { ... },
  "estoque_atual": 35,
  "alerta_reposicao": true,
  "mensagem_alerta": "⚠️ Estoque abaixo do mínimo! Atual: 35 | Mínimo: 50"
}
```

---

## 🗄️ Schema do Banco de Dados

### Tabela `produtos`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| nome | VARCHAR(200) | Nome do produto |
| codigo | VARCHAR(50) | Código único |
| categoria | VARCHAR(100) | Ex: Cimento, Hidráulica |
| unidade | VARCHAR(20) | Ex: kg, saco, m², litro |
| preco_custo | NUMERIC(10,2) | Preço de compra |
| preco_venda | NUMERIC(10,2) | Preço de venda |
| estoque_inicial | NUMERIC(10,3) | Quantidade inicial cadastrada |
| estoque_minimo | NUMERIC(10,3) | Gatilho para alerta de reposição |
| fornecedor | VARCHAR(200) | Nome do fornecedor |
| descricao | TEXT | Informações adicionais |
| ativo | BOOLEAN | Produto ativo/inativo |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Última atualização |

### Tabela `movimentacoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| produto_id | UUID | FK → produtos |
| tipo | VARCHAR(10) | `entrada` ou `saida` |
| quantidade | NUMERIC(10,3) | Quantidade movimentada |
| motivo | VARCHAR(200) | Razão da movimentação |
| observacao | TEXT | Detalhes extras |
| responsavel | VARCHAR(100) | Quem realizou |
| created_at | TIMESTAMPTZ | Data/hora da movimentação |

> O **estoque atual** é sempre calculado dinamicamente:
> `estoque_atual = estoque_inicial + Σ(entradas) - Σ(saídas)`

---

## 🎯 Funcionalidades

- ✅ **Dashboard** com KPIs: total de produtos, alertas, valor em estoque, movimentações recentes
- ✅ **Cadastro completo** de produtos com código, categoria, unidade, preços e estoque
- ✅ **Controle de entradas** com motivo e responsável
- ✅ **Controle de saídas** com validação de estoque disponível
- ✅ **Alertas automáticos** quando estoque ≤ estoque mínimo
- ✅ **Página de Alertas** com criticidade (Baixo / Crítico / Sem Estoque) e déficit calculado
- ✅ **Filtros e busca** por nome, código e categoria
- ✅ **Histórico de movimentações** com filtro por tipo
- ✅ **Gráfico de barras** dos produtos em alerta no dashboard

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Roteamento | React Router DOM v6 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Backend | Node.js + Express |
| Banco de dados | Supabase (PostgreSQL) |
| ORM/Client | @supabase/supabase-js |

---

## 🔒 Boas Práticas de Segurança

- Use sempre a **service_role key** apenas no backend (nunca exponha no frontend)
- Em produção, configure o `CORS` no backend para aceitar apenas a origem do seu frontend
- Adicione autenticação (Supabase Auth ou JWT) antes de ir para produção
- Configure Row Level Security (RLS) no Supabase para proteção adicional

---

## 🔐 Autenticação (Supabase Auth)

O sistema possui tela de **Login** e **Cadastro de usuários** integrados ao Supabase Auth.

### Configurar no Supabase

1. No painel do projeto, vá em **Authentication → Providers** e certifique-se que **Email** está habilitado
2. Opcionalmente em **Authentication → Settings**, desative "Confirm email" para ambiente de dev (assim não precisa confirmar o e-mail)
3. Copie a **anon/public key** em **Project Settings → API**

### Variáveis de ambiente do Frontend

Crie o arquivo `frontend/.env` com:
```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_public_key_aqui
```

> ⚠️ Use a **anon key** (pública) no frontend — nunca a service_role key!

### Fluxo de autenticação

- Usuário não autenticado → redirecionado para `/login`
- Login/Cadastro via Supabase Auth (email + senha)
- Após login → redirecionado para o Dashboard
- Nome do usuário e e-mail exibidos na sidebar
- Botão de logout no menu do usuário (canto inferior da sidebar)
- Badge com contagem de alertas ao lado do menu "Alertas"
