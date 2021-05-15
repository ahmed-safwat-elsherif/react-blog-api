const config = {
  mongoURL: process.env.MONGO_DB,
  saltRounds: process.env.SALT_ROUNDS,
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
  port: process.env.PORT,
};

module.exports = config;
