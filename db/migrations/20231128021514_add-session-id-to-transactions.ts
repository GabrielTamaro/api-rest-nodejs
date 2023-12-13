import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    // o "index()" no final é para criar um índice para esse campo na tabela.
    // com um índice, a consulta fica mais rápida, pois o banco irá optimizar essas
    // buscas por esses campos (muito bom de se utilizar em campos que serão muito usados
    // no where de consultas).
    table.uuid('session_id').after('id').index()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    table.dropColumn('session_id')
  })
}
