const config = {
  url: process.env.MONGODB_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "carelink",
    retryWrites: true,
    w: "majority",
  },
};

module.exports = config;
