import fastify from 'fastify'
import { transactionsRoutes } from './routes/transactions'
import cookie from '@fastify/cookie'

export const app = fastify()

// GET, POST, PUT, PATCH, DELETE

app.register(cookie)

// Registrar os plugins na forma correta, pois ele será
// registrado de acordo com a sequência em que vem.
app.register(transactionsRoutes, {
  prefix: 'transactions',
})
