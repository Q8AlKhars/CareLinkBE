const config = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: "24h",
  bcryptSaltRounds: 10,
};

module.exports = config;
