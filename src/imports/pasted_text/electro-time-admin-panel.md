CONTEXTO

Você é um arquiteto de software Senior, especialista em UX/UI Enterprise, React, TypeScript, Engenharia de Software e Design Systems.

Sua missão é criar um sistema WEB moderno para a empresa Electro Time, focado em Gestores de Recursos Humanos, Supervisores e Administradores.

O objetivo é desenvolver um sistema extremamente elegante, rápido, intuitivo e profissional.

O sistema deve transmitir confiança, organização e produtividade.

A aplicação será consumidora da documentação OpenAPI fornecida.

IMPORTANTE

A documentação OpenAPI está anexada.

Ela possui endpoints para vários tipos de usuários.

NÃO IMPLEMENTAR NENHUMA ROTA DESCRITA COMO

MOBILE COLABORADOR

Toda funcionalidade mobile será desenvolvida por outra equipa.

Ignore completamente essas rotas.

Implemente apenas o painel WEB administrativo.

STACK OBRIGATÓRIA
React 19
TypeScript
Vite
TailwindCSS
shadcn/ui
Framer Motion
Lucide React
React Router DOM
TanStack Query
Axios
React Hook Form
Zod
Zustand
Sonner
Recharts
React Table (TanStack Table)
React Dropzone
DayJS

Arquitetura totalmente escalável.

ESTILO VISUAL

O sistema deve parecer um software Enterprise.

Referências:

Linear
Stripe Dashboard
Vercel
Notion
Deel
Rippling
BambooHR
SAP Fiori
Workday

Jamais criar uma aparência infantil.

PALETA DE CORES

Primária

Azul

#0057D9

Secundária

Amarelo

#FFC107

Acento

Laranja

#FF7A00

Neutros

#FFFFFF

#F8FAFC

#F1F5F9

#CBD5E1

#64748B

#334155

#0F172A

Nunca exagerar no amarelo e no laranja.

Essas cores servem apenas como destaque.

O azul domina toda identidade.

TEMA

Implementar:

Dark Mode

Light Mode

seguindo o padrão do shadcn/ui.

TIPOGRAFIA

Inter

Pesos

400

500

600

700

800

ÍCONES

Utilizar exclusivamente

Lucide React

ANIMAÇÕES

Utilizar Framer Motion.

As animações devem ser discretas.

Exemplos:

Fade

Slide

Scale

Hover

Page Transition

Cards

Loading Skeleton

Microinterações

Nunca exagerar.

EXPERIÊNCIA DO USUÁRIO

A interface deve ser extremamente intuitiva.

Priorizar:

Poucos cliques

Feedback visual imediato

Confirmações elegantes

Skeletons

Loading States

Empty States

Error States

Success States

Toast Notifications

LAYOUT

Desktop First.

Responsivo.

Sidebar fixa.

Navbar superior.

Área central.

Footer discreto.

SIDEBAR

Logo Electro Time

Dashboard

Funcionários

Departamentos

Cargos

Postos

Escalas

Horários

Presenças

Solicitações

Relatórios

Supervisores

Empresas

Configurações

Perfil

Sair

Cada item possui ícone Lucide.

DASHBOARD

Criar dashboard executivo.

KPIs grandes.

Cards modernos.

Gráficos Recharts.

Indicadores:

Funcionários ativos

Presentes hoje

Ausentes

Atrasados

Horas extras

Banco de horas

Departamentos

Postos

Solicitações pendentes

Gráfico semanal

Gráfico mensal

Mapa de presença

Últimas atividades

PÁGINAS

Cada página deve possuir:

Busca

Filtros

Tabela

Paginação

Exportação

CRUD

Drawer

Modal

Confirmações

Skeleton

Loading

COMPONENTES

Criar Design System.

Button

Input

Select

Combobox

Dialog

Alert

Toast

Badge

Avatar

Card

DataTable

Form

DatePicker

Calendar

Tabs

Breadcrumb

Tooltip

Popover

Dropdown

Pagination

Search

Command

EmptyState

StatsCard

MetricCard

Charts

FORMULÁRIOS

Todos usando:

React Hook Form

Zod

Validação completa.

Mensagens amigáveis.

API

Consumir a documentação OpenAPI anexada.

Criar:

services/

api/

hooks/

queries/

mutations/

models/

DTOs

tipagem automática.

Utilizar Axios.

TanStack Query.

Interceptadores.

Refresh Token.

Tratamento global de erros.

AUTENTICAÇÃO

JWT

Refresh Token

Proteção de rotas

Permissões

Perfis

Admin

Supervisor

RH

Gestor

Dono SaaS (quando aplicável)

ESTRUTURA
src/

app/

components/

features/

layouts/

pages/

hooks/

contexts/

providers/

routes/

services/

api/

types/

utils/

constants/

assets/

styles/

store/

lib/

Arquitetura Feature Based.

CÓDIGO

Aplicar:

SOLID

Clean Architecture

Clean Code

Atomic Design

Componentização máxima

Sem duplicação

Código altamente reutilizável.

QUALIDADE

Criar:

Custom Hooks

Context API

Zustand

Error Boundary

Suspense

Lazy Loading

Memoização

Code Splitting

Infinite Scroll quando necessário.

SEGURANÇA

Sanitização

Proteção de rotas

Validação

Tratamento de erros

Timeout

Retry

Logs

ACESSIBILIDADE

ARIA

Navegação por teclado

Contraste

Focus Ring

Labels

RESPONSIVIDADE

Desktop

Notebook

Tablet

Mobile administrativo

O QUE IMPLEMENTAR

Implementar todas as funcionalidades disponíveis para o painel WEB presentes na documentação OpenAPI.

Ignorar completamente qualquer endpoint cuja descrição contenha:

[MOBILE COLABORADOR]

Esses endpoints não fazem parte deste projeto.

PADRÃO DAS TELAS

Cada tela deve conter:

Cabeçalho com título e ações principais.
Breadcrumb.
Barra de pesquisa.
Filtros avançados.
Cards de métricas (quando aplicável).
Tabela moderna com ordenação, paginação e seleção múltipla.
Botões de ação (visualizar, editar, excluir).
Drawer ou modal para criação e edição.
Feedback visual para carregamento, sucesso e erro.
RESULTADO ESPERADO

Gerar uma aplicação SaaS de nível corporativo, com aparência premium, código altamente organizado, arquitetura escalável e pronta para crescer, consumindo a documentação OpenAPI da Electro Time. O foco é exclusivamente o painel WEB para RH, gestores, supervisores e administradores, deixando de fora todas as rotas destinadas ao aplicativo Mobile Colaborador.