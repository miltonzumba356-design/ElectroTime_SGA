/**
 * MSW request handlers — mirror the OpenAPI contract so tests run
 * against a faithful representation of the real API without network calls.
 */
import { http, HttpResponse } from 'msw';

const BASE = 'https://eletro-time-production.up.railway.app';

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────
  http.post(`${BASE}/api/auth/login/`, () =>
    HttpResponse.json({
      access: 'eyJhbGciOiJIUzI1NiJ9.test-access',
      refresh: 'eyJhbGciOiJIUzI1NiJ9.test-refresh',
      tipo_role: 'admin',
      nome: 'Ricardo Mendes',
      email: 'admin@electrotime.com',
    }),
  ),

  http.post(`${BASE}/api/auth/refresh/`, () =>
    HttpResponse.json({ access: 'eyJhbGciOiJIUzI1NiJ9.refreshed-access' }),
  ),

  // ── Admin ────────────────────────────────────────────────────────
  http.get(`${BASE}/api/admin/listar_departamentos/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'Desenvolvimento', descricao: 'Equipe dev', responsavel: 'Maria', total_colaboradores: 8 },
      { id: 2, nome: 'Comercial', descricao: null, responsavel: null, total_colaboradores: 5 },
    ]),
  ),

  http.get(`${BASE}/api/admin/listar_supervisores/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'Maria Santos', email: 'maria@test.com', departamento: 'Desenvolvimento', total_colaboradores: 8, status: 'ativo' },
    ]),
  ),

  http.get(`${BASE}/api/admin/listar_turnos/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'Matutino', horario_entrada: '06:00:00', horario_saida: '14:00:00', horario_almoco_inicio: '10:00:00', horario_almoco_fim: '11:00:00', total_colaboradores: 12 },
    ]),
  ),

  http.get(`${BASE}/api/admin/listar_postos/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'Sede', endereco: 'Av. Paulista', cidade: 'SP', estado: 'SP', latitude: -23.5, longitude: -46.6, raio_geofencing: 150, ativo: true },
    ]),
  ),

  // ── RH ───────────────────────────────────────────────────────────
  http.get(`${BASE}/api/rh/listar_colaboradores/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'João Silva', email: 'joao@test.com', cpf: '123.456.789-00', matricula: 'ET-0001', cargo: 'Engenheiro', departamento: 'Desenvolvimento', status: 'ativo' },
      { id: 2, nome: 'Ana Costa', email: 'ana@test.com', cpf: null, matricula: 'ET-0002', cargo: 'Designer', departamento: 'Comercial', status: 'ferias' },
    ]),
  ),

  http.get(`${BASE}/api/rh/listar_ferias/`, () =>
    HttpResponse.json([
      { id: 1, colaborador_id: 1, colaborador_nome: 'João Silva', data_inicio: '2026-07-01', data_fim: '2026-07-15', dias: 15, status: 'aprovado', criado_em: '2026-06-01T10:00:00Z' },
    ]),
  ),

  http.get(`${BASE}/api/rh/listar_contratos/`, () =>
    HttpResponse.json([
      { id: 1, colaborador_id: 1, colaborador_nome: 'João Silva', tipo_contrato: 'clt', status: 'ativo', salario_base: '5000.00', data_inicio: '2024-01-01' },
    ]),
  ),

  http.get(`${BASE}/api/rh/listar_feriados/`, () =>
    HttpResponse.json([
      { id: 1, nome: 'Natal', data: '2026-12-25', tipo: 'nacional', recorrente: true },
      { id: 2, nome: 'Independência', data: '2026-11-11', tipo: 'nacional', recorrente: true },
    ]),
  ),

  http.get(`${BASE}/api/rh/listar_declaracoes/`, () =>
    HttpResponse.json([
      { id: 1, colaborador_id: 1, colaborador_nome: 'João Silva', tipo: 'employment', assunto: 'Declaração de Vínculo', conteudo: 'Declaramos que...', status: 'enviada', criado_em: '2026-06-01T10:00:00Z' },
    ]),
  ),

  http.get(`${BASE}/api/rh/folha_pagamento/`, () =>
    HttpResponse.json({
      id: 1, mes: 6, ano: 2026, status: 'pendente',
      total_gross: 50000, total_net: 42000, total_employees: 10,
      erp_exported: false, itens: [],
    }),
  ),

  // ── Supervisor ───────────────────────────────────────────────────
  http.get(`${BASE}/api/supervisor/relatorio_faltas/`, () =>
    HttpResponse.json([
      { colaborador_nome: 'Pedro Lima', departamento: 'Logística', total_faltas: 2, dias: ['2026-06-03', '2026-06-10'] },
    ]),
  ),

  http.get(`${BASE}/api/supervisor/presenças_pendentes/`, () =>
    HttpResponse.json([]),
  ),

  // ── SaaS ─────────────────────────────────────────────────────────
  http.get(`${BASE}/api/admin-saas/logs/`, () =>
    HttpResponse.json({
      count: 1, next: null, previous: null,
      results: [
        { id: 1, acao: 'login', descricao: 'Login bem-sucedido', usuario: 'admin', criado_em: '2026-06-19T10:00:00Z' },
      ],
    }),
  ),

  http.get(`${BASE}/api/admin-saas/solicitacoes/`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
  ),
];
