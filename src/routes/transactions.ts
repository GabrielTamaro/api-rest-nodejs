import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// Testes:
// unitários: unidade da sua aplicação (uma parte totalmente isolada).
// integração: comunicação entre duas ou mais unidades.
// e2e - ponto a ponta: simulam um usuário operando na aplicação.

// Pirâmide de testes: E2E (não dependem de nenhuma tecnologa, não dependem de arquitetura)

// Cookies - formas para manter contexto entre requisições

// Criação de um plugin (sendo uma rota dentro da nossa aplicação, separar rotas).
// Todos os plugins precisam ser uma função assíncrona.
export async function transactionsRoutes(app: FastifyInstance) {
  // Como se fosse um middleware global, um hook que vai lidar com os handlers
  app.addHook('preHandler', async (request) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamSchema.parse(request.params)

      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
        .first()

      return { summary }
    },
  )

  // Esse reply é o mesmo do response, porém o fastify chama de reply.
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      // path serve para mostrar quais rotas podem acessar esse cookie
      // expires tem que passar a data corretamente do momento que deve expirar
      // maxAge a gente passa um valor de duração para o cookie (em milisegundos)
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
