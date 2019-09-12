require('dotenv').config()

const Hapi = require('Hapi')
const mongoose = require('mongoose')
const { ApolloServer } = require('apollo-server-hapi')

/* Swagger section */
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

const Painting = require('./models/Painting')
const schema = require('./graphql/schema')

const app = Hapi.server({
  port: 4000,
  host: 'localhost'
})

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
mongoose.connection.once('open', () => console.log('connected to database'))

const init = async () => {

  const server = new ApolloServer({ schema });

  await server.applyMiddleware({ app })

  await server.installSubscriptionHandlers(app.listener);

  await app.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'Paintings API Documentation',
          version: Pack.version
        }
      }
    }
  ])

  app.route([
    {
      method: 'GET',
      path: '/api/v1/paintings',
      config: {
        description: 'Get all the paintings',
        tags: ['api', 'v1', 'painting']
      },
      handler: (req, reply) => {
        return Painting.find();
      }
    },
    {
      method: 'POST',
      path: '/api/v1/paintings',
      config: {
        description: 'Get a specific painting by ID.',
        tags: ['api', 'v1', 'painting']
      },
      handler: (req, reply) => {
        const { name, url, technique } = req.payload;
        const painting = new Painting({
          name,
          url,
          technique
        });

        return painting.save();
      }
    }
  ])

  await app.start();

  console.log(`Server is running at: ${app.info.uri}`);
}

init()
  .catch(err => console.log(err));