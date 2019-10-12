module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dunder_mifflin:12345@localhost/noteful',
    TEST_DATABASE_URL : process.env.TEST_DATABASE_URL || 'postgresql://dunder_mifflin:12345@localhost/noteful-test'
  }