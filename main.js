const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Mongoose = require('mongoose');
//const Age = Joi.extend(require('joi-age'));

const init = async () => {
  const server = new Hapi.Server({
    port: 3009,
    host: 'localhost',
  });

  Mongoose.connect('mongodb://localhost/PersonalDetails');

  const PersonalDetails = Mongoose.model('people', {
    firstname: String,
    lastname: String,
    email: String,
    mobile: String,
    disabled: Boolean,
    dob: Date,
    blood_group: String,
  });

  server.route({
    method: 'POST',
    path: '/people',
    options: {
      validate: {
        payload: Joi.object({
          firstname: Joi.string().max(10).min(2).required(),
          lastname: Joi.string().max(10).min(2).required(),
          email: Joi.string().trim().email().required(),
          mobile: Joi.string()
            .length(10)
            .pattern(/^[0-9]+$/)
            .required(),
          disabled: Joi.boolean().required(),
          //dob: Age.date().minage(18).maxage(58).required(),
          blood_group: Joi.string().required(),
        }),
        failAction: (request, h, error) => {
          return error.isJoi
            ? h.response(error.details[0]).takeover()
            : h.response(error).takeover();
        },
      },
    },
    handler: async (request, h) => {
      try {
        var people = new PersonalDetails(request.payload);
        var result = await people.save();
        return h.response(result);
      } catch (error) {
        return h.response(error).code(500);
      }
    },
  });

  server.route({
    method: 'GET',
    path: '/people/{id}',
    handler: async (request, h) => {
      try {
        var people = await PersonalDetails.find().exec();
        return h.response(people);
      } catch (error) {
        return h.response(error).code(500);
      }
    },
  });
  

  server.route({
    method: 'PUT',
    path: '/people/{id}',
    options: {
      validate: {
        payload: Joi.object({
          firstname: Joi.string().optional(),
          lastname: Joi.string().optional(),
          email: Joi.string().optional(),
          mobile: Joi.string().optional(),
          disabled: Joi.boolean().optional(),
          //dob: Age.date().optional(),
          blood_group: Joi.string().optional(),
        }),
        failAction: (request, h, error) => {
          return error.isJoi
            ? h.response(error.details[0]).takeover()
            : h.response(error).takeover();
        },
      },
    },
    handler: async (request, h) => {
      try {
        var result = await PersonalDetails.findByIdAndUpdate(
          request.params.id,
          request.payload,
          { new: true }
        );
        return h.response(result);
      } catch (error) {
        return h.response(error).code(500);
      }
    },
  });

  server.route({
    method: 'DELETE',
    path: '/people/{id}',
    handler: async (request, h) => {
      try {
        var result = await PersonalDetails.findByIdAndDelete(request.params.id);
        return h.response(result);
      } catch (error) {
        return h.response(error).code(500);
      }
    },
  });

  server.start();
  console.log(`Server running on ${server.info.uri}`);
};
process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
init();
